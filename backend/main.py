import io
import os
import math
import json
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

# LLM & Embeddings SDKs
from groq import Groq  # type: ignore
from google import genai

# Firebase SDK
import firebase_admin
from firebase_admin import credentials, firestore

# ----------------------------------------------------
# Load Environment Variables
# ----------------------------------------------------

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GEMINI_API_KEY or not GROQ_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY or GROQ_API_KEY in environment variables.")

# ----------------------------------------------------
# Clients & Firebase Setup (Supports Raw JSON, File Paths & Local Fallback)
# ----------------------------------------------------

groq_client = Groq(api_key=GROQ_API_KEY)
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Check both common variable names
firebase_env = os.getenv("FIREBASE_CREDENTIALS") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if not firebase_admin._apps:
    if firebase_env:
        env_str = firebase_env.strip()
        try:
            if env_str.startswith("{"):
                # Case 1: Raw JSON string passed in environment variable
                cred_dict = json.loads(env_str)
                cred = credentials.Certificate(cred_dict)
            else:
                # Case 2: File path passed in environment variable (e.g. ./firebase.json)
                cred = credentials.Certificate(env_str)
        except Exception as e:
            raise RuntimeError(f"Failed to parse Firebase credentials from environment variable: {e}")
    else:
        # Case 3: Local Development Fallback to local firebase.json file
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        FIREBASE_PATH = os.path.join(BASE_DIR, "firebase.json")
        if not os.path.exists(FIREBASE_PATH):
            raise RuntimeError(
                f"Firebase credentials not found in env (FIREBASE_CREDENTIALS) or local file at:\n{FIREBASE_PATH}"
            )
        cred = credentials.Certificate(FIREBASE_PATH)

    firebase_admin.initialize_app(cred)

db = firestore.client()

# ----------------------------------------------------
# FastAPI App & Models
# ----------------------------------------------------

class ChatRequest(BaseModel):
    document_id: str
    question: str

app = FastAPI(title="AI Document RAG Engine", version="4.0")

# ----------------------------------------------------
# Global Exception Catch-All Middleware (Prevents CORS-masked 500s)
# ----------------------------------------------------

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        print(f"[Backend Error]: {exc}")
        origin = request.headers.get("origin", "*")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Server Error: {str(exc)}"},
            headers={
                "Access-Control-Allow-Origin": origin if origin != "*" else "http://localhost:5173",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )

# ----------------------------------------------------
# CORS Middleware
# ----------------------------------------------------

origins = [
    "https://doc-summeriser-ai-4fi5.vercel.app",  # Production Vercel Frontend
    "http://localhost:5173",                       # Vite Local Dev
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

frontend_env = os.getenv("FRONTEND_URL")
if frontend_env:
    origins.append(frontend_env.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# RAG Helper Functions
# ----------------------------------------------------

def extract_text(file_bytes: bytes, filename: str) -> str:
    filename = filename.lower()
    if filename.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")

    if filename.endswith(".pdf"):
        pdf = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()

    raise HTTPException(status_code=400, detail="Only PDF and TXT supported.")


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> list:
    """Splits text into overlapping semantic chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks


def cosine_similarity(v1: list, v2: list) -> float:
    """Calculates vector cosine similarity."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def embedding_with_gemini(text: str) -> list:
    try:
        response = gemini_client.models.embed_content(
            model="text-embedding-004",
            contents=text[:5000]
        )
        return response.embeddings[0].values
    except Exception as e:
        print(f"[Warning] Embedding error: {e}")
        return []


def summarize_with_groq(text: str) -> str:
    prompt = f"""
You are an expert AI document analyst. Summarize the document accurately in clean markdown.

Include:
# Executive Summary
# Key Insights
# Important Facts
# Conclusion

Document:
{text[:30000]}
"""
    try:
        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
        )
        return completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")

# ----------------------------------------------------
# API Endpoints
# ----------------------------------------------------

@app.get("/")
def health():
    return {"status": "online", "service": "RAG Document Engine"}


@app.post("/summarize")
async def summarize_document(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        text = extract_text(file_bytes, file.filename)
        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in document.")

        # 1. Executive Summary via Groq Llama 3.3
        summary_res = summarize_with_groq(text)

        # 2. Chunk text & generate Gemini Embeddings
        raw_chunks = chunk_text(text)
        embedded_chunks = []
        for i, chunk in enumerate(raw_chunks[:10]):
            vec = embedding_with_gemini(chunk)
            embedded_chunks.append({
                "chunk_id": i,
                "text": chunk,
                "embedding": vec
            })

        # 3. Store document record with chunk vectors in Firestore
        document = {
            "filename": file.filename,
            "summary": summary_res,
            "char_count": len(text),
            "chunks": embedded_chunks,
            "created_at": firestore.SERVER_TIMESTAMP
        }

        ref = db.collection("documents").document()
        ref.set(document)

        return {
            "status": "success",
            "document_id": ref.id,
            "filename": file.filename,
            "summary": summary_res
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat_with_document(req: ChatRequest):
    """RAG Search Endpoint: Query document using Gemini Vector Search + Groq Llama 3.3."""
    try:
        doc_ref = db.collection("documents").document(req.document_id).get()
        if not doc_ref.exists:
            raise HTTPException(status_code=404, detail="Document not found.")

        doc_data = doc_ref.to_dict()
        chunks = doc_data.get("chunks", [])

        if not chunks:
            raise HTTPException(status_code=400, detail="No embedded chunks available for this document.")

        # 1. Generate query embedding via Gemini
        q_vector = embedding_with_gemini(req.question)

        # 2. Vector search: find top-3 scoring chunks using Cosine Similarity
        scored_chunks = []
        for c in chunks:
            score = cosine_similarity(q_vector, c.get("embedding", []))
            scored_chunks.append((score, c["text"]))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_context = "\n---\n".join([item[1] for item in scored_chunks[:3]])

        # 3. Generate answer using retrieved context + Groq Llama 3.3
        prompt = f"""
You are an AI assistant answering questions about an uploaded document.
Answer the user's question accurately using ONLY the context provided below.

Context from Document:
{top_context}

Question: {req.question}

Answer in clear markdown format. If the answer is not in the context, state "Information not found in document."
"""

        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
        )

        return {
            "answer": completion.choices[0].message.content,
            "cited_chunks": len(scored_chunks[:3])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents")
def documents():
    try:
        docs = db.collection("documents").order_by("created_at", direction=firestore.Query.DESCENDING).limit(10).stream()
        result = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            if "chunks" in data:
                del data["chunks"]
            if "created_at" in data and data["created_at"]:
                data["created_at"] = str(data["created_at"])
            result.append(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """Deletes a document and its vector embeddings from Firestore."""
    try:
        doc_ref = db.collection("documents").document(doc_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Document not found.")

        doc_ref.delete()
        return {"status": "success", "message": f"Document {doc_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
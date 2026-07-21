
>> actiavte env :  .\.venv\Scripts\Activate.ps1

# 📄 AI Document Summarizer & RAG Engine

A production-ready **AI Document Intelligence Platform** built using **FastAPI**, **React (Vite)**, **Google Gemini**, **Groq Llama 3.3**, and **Firebase Firestore**.

The platform enables users to upload PDF or TXT documents, automatically extracts text, generates structured AI summaries, creates semantic vector embeddings, and provides an interactive **Retrieval-Augmented Generation (RAG)** chat interface for asking questions about uploaded documents.

---

# 🚀 Features

- 📄 Upload PDF & TXT documents
- 🧠 AI-powered document summarization
- 🔍 Semantic search using vector embeddings
- 💬 Chat with documents (RAG)
- ⚡ Ultra-fast LLM inference using Groq
- ☁️ Firebase Firestore cloud storage
- 📋 Markdown summary generation
- 📥 Download summaries
- 📚 Upload history management
- 🌙 Modern responsive React dashboard

---

# 🏛️ System Architecture

```text
               ┌──────────────────────────────────────────────┐
               │            React (Vite) Frontend             │
               │ Upload │ Chat │ Summary │ History Dashboard  │
               └──────────────────────┬───────────────────────┘
                                      │
                              HTTP / REST API
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │              FastAPI Backend                 │
               │ PDF Parser │ Chunker │ RAG │ AI Controller   │
               └──────────────┬───────────────┬───────────────┘
                              │               │
                    Summarization        Vector Embeddings
                              │               │
                    ┌──────────▼───┐   ┌──────▼────────┐
                    │ Groq Llama 3 │   │ Gemini API    │
                    │ 3.3 70B      │   │ Embeddings    │
                    └──────────────┘   └───────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Firebase Firestore  │
                    │ Document Metadata   │
                    │ Embeddings          │
                    │ Summary             │
                    └─────────────────────┘
```

---

# 🧠 How It Works Under the Hood

## 1️⃣ Document Extraction

Users upload a PDF or TXT file.

- PDF files are processed using **PyPDF**
- TXT files are decoded directly
- Raw document text is extracted

---

## 2️⃣ Overlapping Chunking

Large documents exceed the context window of modern LLMs.

The extracted text is divided into overlapping chunks:

- Chunk Size: **1200 characters**
- Overlap: **200 characters**

Formula:

$$
Chunk_i = Text[Start : Start + 1200]
$$

The overlap preserves contextual continuity between neighbouring chunks.

---

## 3️⃣ Dense Vector Embeddings

Each chunk is converted into a semantic vector using **Google Gemini Embeddings**.

Example:

$$
Embedding(Text)
=
[-0.023,\ 0.081,\ 0.412,\ ...,\ 0.005]
$$

Each vector captures semantic meaning rather than keywords, enabling similarity search.

---

## 4️⃣ AI Summarization

The complete document is summarized using

**Groq**
- Model: **Llama 3.3 70B Versatile**

The AI generates:

- Executive Summary
- Key Insights
- Important Facts
- Conclusion

All responses are returned as Markdown.

---

## 5️⃣ Retrieval-Augmented Generation (RAG)

When a user asks a question:

Example:

> "What are the major risks discussed in the document?"

### Step 1

The question is converted into an embedding vector.

$$
Q
$$

---

### Step 2

Cosine Similarity is calculated between the query vector and every stored chunk.

$$
Similarity(Q,V)=
\frac{Q \cdot V}
{\|Q\|\|V\|}
$$

Expanded:

$$
Similarity(Q,V)
=
\frac{\sum Q_iV_i}
{\sqrt{\sum Q_i^2}
\sqrt{\sum V_i^2}}
$$

---

### Step 3

The top 3 most relevant chunks are retrieved.

---

### Step 4

Those chunks are injected into the LLM prompt.

The LLM answers only using retrieved document context, reducing hallucinations.

---

# 🔑 API Keys

| Provider | Purpose |
|-----------|----------|
| Google AI Studio | Gemini Embeddings |
| Groq Cloud | Llama 3.3 Summarization |
| Firebase | Firestore Database |

## Google AI Studio

Create an API key for Gemini.

```
GEMINI_API_KEY=YOUR_KEY
```

---

## Groq

Generate a Groq API key.

```
GROQ_API_KEY=YOUR_KEY
```

---

## Firebase

Download a **Service Account JSON**

Project Settings

↓

Service Accounts

↓

Generate New Private Key

Save as

```
backend/firebase.json
```

---

# 📂 Project Structure

```text
AI/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── firebase.json
│   ├── .env
│   └── uploads/
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── index.css
        │
        ├── services/
        │   └── api.js
        │
        └── components/
            ├── Header.jsx
            ├── UploadBox.jsx
            ├── SummaryCard.jsx
            ├── ChatBox.jsx
            ├── History.jsx
            ├── Loading.jsx
            └── Footer.jsx
```

---

# ⚙️ Installation

## Backend

```bash
cd backend

uv venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

uv pip install -r requirements.txt

uvicorn main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

Swagger:

```
http://127.0.0.1:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# 📄 Environment Variables

```env
GEMINI_API_KEY=YOUR_GEMINI_KEY

GROQ_API_KEY=YOUR_GROQ_KEY

LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=YOUR_LANGSMITH_KEY
LANGSMITH_PROJECT=vaibhav-ai

GOOGLE_APPLICATION_CREDENTIALS=./firebase.json
```

---

# 📡 API Endpoints

| Method | Endpoint | Description |
|----------|----------|-------------|
| GET | `/` | Health Check |
| POST | `/summarize` | Upload & Summarize Document |
| POST | `/chat` | Ask Questions (RAG) |
| GET | `/documents` | Fetch Uploaded Documents |
| DELETE | `/documents/{id}` | Delete Document |

---

# 🚀 Future Improvements

- Multi-document RAG
- PDF Preview
- OCR Support
- Whisper Audio Upload
- Background Processing
- Hybrid Search (BM25 + Vectors)
- User Authentication
- Team Workspace
- Export as PDF/DOCX
- Pinecone / ChromaDB Integration
- Docker Deployment
- Kubernetes Support

---

# 🛠️ Tech Stack

### Frontend

- React
- Vite
- CSS
- React Markdown

### Backend

- FastAPI
- Python
- PyPDF
- Firebase Admin SDK

### AI

- Google Gemini Embeddings
- Groq Llama 3.3
- Retrieval-Augmented Generation (RAG)

### Database

- Firebase Firestore

---

# 📜 License

This project is licensed under the **MIT License**.

---

## ⭐ If you found this project useful, consider giving it a Star on GitHub!
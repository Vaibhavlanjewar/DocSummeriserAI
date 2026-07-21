// frontend/src/services/api.js

// Dynamic API URL: Environment Variable OR Live Production Vercel Backend
// const API_BASE_URL =  "http://127.0.0.1:8000" ||"https://doc-summarizer-backend.onrender.com";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://doc-summarizer-backend.onrender.com";

// 1. Upload & Summarize Document
export const summarizeDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload and summarize document.");
  }

  return await response.json(); // Returns { status, document_id, filename, summary }
};

// 2. Chat / Q&A with Document (RAG)
export const chatWithDocument = async (documentId, question) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to process question.");
  }

  return await response.json(); // Returns { answer, cited_chunks }
};

// 3. Fetch Recent Documents History
export const fetchDocuments = async () => {
  const response = await fetch(`${API_BASE_URL}/documents`);
  if (!response.ok) {
    throw new Error("Failed to fetch document history.");
  }
  return await response.json();
};

// 4. Delete Document
export const deleteDocument = async (documentId) => {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete document.");
  }

  return await response.json();
};
import { useEffect, useState } from "react";
import { deleteDocument } from "../services/api";

export default function History({ refreshKey }) {
  const [docs, setDocs] = useState([]);

  const fetchDocs = () => {
    fetch("http://127.0.0.1:8000/documents")
      .then((r) => r.json())
      .then(setDocs)
      .catch(console.error);
  };

  useEffect(() => {
    fetchDocs();
  }, [refreshKey]);

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      await deleteDocument(docId);
      // Remove deleted item directly from state
      setDocs((prevDocs) => prevDocs.filter((d) => d.id !== docId));
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  if (docs.length === 0) return null;

  return (
    <div className="history">
      <h2>Recent Documents</h2>
      <div className="history-grid">
        {docs.map((doc) => (
          <div className="history-item" key={doc.id}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📄</span>
              <h4>{doc.filename}</h4>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <small>{doc.char_count ? `${doc.char_count} chars` : "Processed"}</small>
              <button
                onClick={() => handleDelete(doc.id, doc.filename)}
                title="Delete document"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  transition: "background 0.2s"
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
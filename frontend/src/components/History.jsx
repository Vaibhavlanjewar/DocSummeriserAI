import { deleteDocument } from "../services/api";

export default function History({ history, onSelectDoc, onRefresh }) {
  const handleDelete = async (e, docId, filename) => {
    e.stopPropagation(); // Prevents triggering onSelectDoc when clicking delete
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      await deleteDocument(docId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  if (!history || history.length === 0) return null;

  return (
    <div className="history">
      <h2>Recent Documents</h2>
      <div className="history-grid">
        {history.map((doc) => (
          <div 
            className="history-item" 
            key={doc.id}
            onClick={() => onSelectDoc(doc)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📄</span>
              <h4>{doc.filename}</h4>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <small>{doc.char_count ? `${doc.char_count} chars` : "Processed"}</small>
              <button
                onClick={(e) => handleDelete(e, doc.id, doc.filename)}
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
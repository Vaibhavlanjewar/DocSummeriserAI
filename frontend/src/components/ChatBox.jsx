import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { chatWithDocument } from "../services/api";

export default function ChatBox({ documentId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!documentId) return null;

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQ = question;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: userQ }]);
    setLoading(true);

    try {
      const res = await chatWithDocument(documentId, userQ);
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="summary-card" style={{ marginTop: "20px" }}>
      <h2>💬 Chat with Document (RAG Search)</h2>
      
      <div className="chat-thread" style={{ margin: "16px 0", maxHeight: "300px", overflowY: "auto" }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "10px",
              background: m.role === "user" ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
              textAlign: "left"
            }}
          >
            <strong>{m.role === "user" ? "You: " : "AI Assistant:"}</strong>
            <div className="markdown-body">
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <p style={{ color: "var(--text-muted)" }}>Searching vector embeddings & generating answer...</p>}
      </div>

      <form onSubmit={handleAsk} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Ask a question about this document..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "rgba(0,0,0,0.2)",
            color: "#fff"
          }}
        />
        <button type="submit" className="submit-btn" disabled={loading}>
          Ask
        </button>
      </form>
    </div>
  );
}
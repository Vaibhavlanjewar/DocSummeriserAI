import React, { useState, useEffect } from "react";
import "./App.css"; // Imports custom CSS rules
import Header from "./components/Header";
import Footer from "./components/Footer";
import UploadBox from "./components/UploadBox";
import SummaryCard from "./components/SummaryCard";
import ChatBox from "./components/ChatBox";
import History from "./components/History";
import Loading from "./components/Loading";
import { fetchDocuments } from "./services/api";

function App() {
  const [currentDoc, setCurrentDoc] = useState(null); // { document_id, filename, summary }
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    try {
      const docs = await fetchDocuments();
      setHistory(docs);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSummarySuccess = (data) => {
    setCurrentDoc({
      document_id: data.document_id,
      filename: data.filename,
      summary: data.summary,
    });
    setError(null);
    loadHistory();
  };

  const handleSelectDocFromHistory = (doc) => {
    setCurrentDoc({
      document_id: doc.id,
      filename: doc.filename,
      summary: doc.summary,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container">
      <Header />

      {error && (
        <div style={{
          background: "rgba(239, 68, 68, 0.2)",
          border: "1px solid rgba(239, 68, 68, 0.5)",
          color: "#fca5a5",
          padding: "12px 16px",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>
      )}

      {isLoading && <Loading />}

      <UploadBox
        onSuccess={handleSummarySuccess}
        setIsLoading={setIsLoading}
        setError={setError}
      />

      {currentDoc && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <SummaryCard
            filename={currentDoc.filename}
            summary={currentDoc.summary}
          />
          <ChatBox documentId={currentDoc.document_id} />
        </div>
      )}

      <History
        history={history}
        onSelectDoc={handleSelectDocFromHistory}
        onRefresh={loadHistory}
      />

      <Footer />
    </div>
  );
}

export default App;
// frontend/src/App.jsx

import React, { useState, useEffect } from "react";
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

  // Load document history on mount
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

  // Handler when a document is uploaded & summarized
  const handleSummarySuccess = (data) => {
    setCurrentDoc({
      document_id: data.document_id,
      filename: data.filename,
      summary: data.summary,
    });
    setError(null);
    loadHistory(); // Refresh sidebar history
  };

  // Handler to select an old document from history
  const handleSelectDocFromHistory = (doc) => {
    setCurrentDoc({
      document_id: doc.id,
      filename: doc.filename,
      summary: doc.summary,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-100 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Global Loading Overlay */}
        {isLoading && <Loading />}

        {/* Upload Section */}
        <section>
          <UploadBox
            onSuccess={handleSummarySuccess}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        </section>

        {/* Results Section (Summary + RAG Chat) */}
        {currentDoc && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
            {/* Left Column: Markdown Summary */}
            <SummaryCard
              filename={currentDoc.filename}
              summary={currentDoc.summary}
            />

            {/* Right Column: Interactive RAG Chat */}
            <ChatBox documentId={currentDoc.document_id} />
          </section>
        )}

        {/* History Section */}
        <section className="pt-8 border-t border-slate-800">
          <History
            history={history}
            onSelectDoc={handleSelectDocFromHistory}
            onRefresh={loadHistory}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
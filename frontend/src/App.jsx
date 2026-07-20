import { useState } from "react";

import Header from "./components/Header";
import UploadBox from "./components/UploadBox";
import Loading from "./components/Loading";
import SummaryCard from "./components/SummaryCard";
import ChatBox from "./components/ChatBox";
import History from "./components/History";
import Footer from "./components/Footer";

import { uploadDocument } from "./services/api";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [documentId, setDocumentId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const upload = async (file) => {
    try {
      setLoading(true);
      const result = await uploadDocument(file);
      setSummary(result.summary);
      setDocumentId(result.document_id);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Header />
      <UploadBox onUpload={upload} />
      {loading && <Loading />}
      <SummaryCard summary={summary} />
      <ChatBox documentId={documentId} />
      <History refreshKey={refreshKey} />
      <Footer />
    </div>
  );
}
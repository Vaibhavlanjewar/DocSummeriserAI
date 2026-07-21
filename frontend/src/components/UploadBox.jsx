import { useState } from "react";
import { summarizeDocument } from "../services/api";

export default function UploadBox({ onSuccess, setIsLoading, setError }) {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a PDF or TXT file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await summarizeDocument(file);
      onSuccess(data);
    } catch (err) {
      setError(err.message || "Failed to process document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <form className="upload-box" onSubmit={handleSubmit}>
      <label 
        className="file-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ cursor: "pointer", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}
      >
        <span className="upload-icon">📁</span>
        <div>
          <strong>Choose a document</strong> or drag & drop here
        </div>
        <small style={{ color: "var(--text-muted)" }}>Supports PDF, TXT</small>

        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          onClick={(e) => { e.target.value = null; }}
          style={{ display: "none" }}
        />
      </label>

      {file && <div className="selected-file">📄 Selected: {file.name}</div>}

      <button type="submit" className="submit-btn" disabled={!file}>
        Summarize Document
      </button>
    </form>
  );
}
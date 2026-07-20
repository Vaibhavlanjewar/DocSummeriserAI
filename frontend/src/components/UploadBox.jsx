import { useState } from "react";

export default function UploadBox({ onUpload }) {
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a PDF or TXT file.");
      return;
    }
    onUpload(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Drag & Drop Handlers
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
      {/* The entire zone is wrapped in a native <label> */}
      <label 
        className="file-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <span className="upload-icon">📁</span>
        <div>
          <strong>Choose a document</strong> or drag & drop here
        </div>
        <small style={{ color: "var(--text-muted)" }}>Supports PDF, TXT</small>

        {/* Input nested inside <label> guarantees opening file explorer */}
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          onClick={(e) => { e.target.value = null; }} // Allows re-selecting same file
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
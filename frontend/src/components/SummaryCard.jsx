import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function SummaryCard({ summary }) {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  const copy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.md";
    a.click();
  };

  return (
    <div className="summary-card">
      <div className="summary-header">
        <h2>Document Summary</h2>
        <div className="action-btns">
          <button className="btn-secondary" onClick={copy}>
            {copied ? "✓ Copied!" : "Copy"}
          </button>
          <button className="btn-secondary" onClick={download}>
            Download .md
          </button>
        </div>
      </div>

      <div className="markdown-body">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
}
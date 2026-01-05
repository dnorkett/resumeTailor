import { useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:3001";

export default function App() {
  const [baseResume, setBaseResume] = useState("");
  const [jobListing, setJobListing] = useState("");  
  const [tone, setTone] = useState("neutral");
  const [emphasis, setEmphasis] = useState("impact");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function downloadTextFile({ filename, content, mime }) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function isoDateForFilename() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function generate() {
    setError("");
    setOutput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseResume,
          jobListing,
          options: { tone, emphasis },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Request failed");
      setOutput(data.tailoredResumeMd || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocx() {
    const res = await fetch(`${API_BASE}/api/export/docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: output }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "DOCX export failed.");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored-resume.docx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div className="logoBox" />
          <div className="titleWrap">
            <h1 className="h1">Resume Tailor</h1>
            <p className="subtitle">Paste resume + job listing → tailored Markdown resume</p>
          </div>
        </div>
      </div>

      <div className="panel panelPad">
        <div className="controlsRow">
          <div className="controlsLeft">            

            <label className="fieldLabel">
              Tone
              <select className="select" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="neutral">Neutral</option>
                <option value="conversational">Conversational</option>
                <option value="executive">Executive</option>
              </select>
            </label>

            <label className="fieldLabel">
              Emphasis
              <select className="select" value={emphasis} onChange={(e) => setEmphasis(e.target.value)}>
                <option value="impact">Impact</option>
                <option value="skills">Skills</option>
                <option value="leadership">Leadership</option>
              </select>
            </label>
          </div>

          <div className="btnRow">
            <button className="buttonPrimary" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </button>
            
            <button 
              className="buttonSecondary"
              onClick={() => 
                downloadTextFile({
                    filename: `tailored-resume-${isoDateForFilename()}.md`, content: output, mime: "text/markdown;charset=utf-8", 
                  })
              }
              disabled={!output}
              >
              Download .md
            </button>
            <button
              className="buttonSecondary"
              onClick={async () => {
                try {
                  await downloadDocx();
                } catch (e) {
                  setError(e.message);
                }
              }}
              disabled={!output}
            >
              Download .docx
          </button>
          </div>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="panel panelPad">
          <div className="sectionHeader">
            <h3 className="h3">Base Resume / Skills Dump</h3>
            <div className="counter">{baseResume.trim().length} chars</div>
          </div>
          <textarea
            value={baseResume}
            onChange={(e) => setBaseResume(e.target.value)}
            rows={16}
            className="textarea"
            placeholder="Paste your existing resume or skills dump..."
          />
        </div>

        <div className="panel panelPad">
          <div className="sectionHeader">
            <h3 className="h3">Job Listing</h3>
            <div className="counter">{jobListing.trim().length} chars</div>
          </div>
          <textarea
            value={jobListing}
            onChange={(e) => setJobListing(e.target.value)}
            rows={16}
            className="textarea"
            placeholder="Paste the job listing text..."
          />
        </div>
      </div>

      <div className="panel panelPad" style={{ marginTop: 14 }}>
        <div className="sectionHeader">
          <h3 className="h3">Tailored Resume (Markdown)</h3>
          <div className="counter">{output.trim().length} chars</div>
        </div>
        <textarea
          value={output}
          readOnly
          rows={18}
          className="textarea outputArea"
          placeholder="Your tailored resume will appear here..."
        />
      </div>
    </div>
  );
}

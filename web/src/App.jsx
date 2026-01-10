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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");  
  const [showContact, setShowContact] = useState(false);
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedIn, setLinkedIn] = useState("");

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

  function slugifyForFilename(s) {
  return String(s || "")
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  }

  function buildResumeFilenameBase() {
    const first = slugifyForFilename(firstName);
    const last = slugifyForFilename(lastName);
    const comp = slugifyForFilename(company);

    const namePart =
      first && last ? `${first}_${last}` : first || last || "Resume";

    // Desired: FIRST_LAST_COMPANY_RESUME
    if (comp) return `${namePart}_${comp}_Resume`;
    return `${namePart}_Resume`;
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

  async function downloadDocx(baseFilename) {
    const res = await fetch(`${API_BASE}/api/export/docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        markdown: output,
        firstName,
        lastName,
        location,
        phone,
        email,
        linkedIn,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "DOCX export failed.");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseFilename}.docx`;
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
              First
              <input
                className="select"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
              />
            </label>

            <label className="fieldLabel">
              Last
              <input
                className="select"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
              />
            </label>

            <label className="fieldLabel">
              Company
              <input
                className="select"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
              />
            </label>

            <button
              type="button"
              className="buttonSecondary"
              onClick={() => setShowContact((v) => !v)}
              style={{ padding: "8px 10px" }}
            >
              {showContact ? "Hide contact info" : "+ Contact info"}
            </button>

            {showContact && (
              <div style={{ width: "100%", marginTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, alighnItems: "end" }}>
                  <label className="fieldLabel">
                    Location
                    <input
                      className="select"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, ST"
                    />
                  </label>

                  <label className="fieldLabel">
                    Phone
                    <input
                      className="select"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 555-5555"
                    />
                  </label>

                  <label className="fieldLabel">
                    Email
                    <input
                      className="select"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                    />
                  </label>

                  <label className="fieldLabel">
                    LinkedIn
                    <input
                      className="select"
                      value={linkedIn}
                      onChange={(e) => setLinkedIn(e.target.value)}
                      placeholder="linkedin.com/in/you"
                    />
                  </label>
                </div>
              </div>
            )}
            
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
              onClick={() => {
                const base = buildResumeFilenameBase();
                downloadTextFile({
                filename: `${base}.md`,
                content: output,
                mime: "text/markdown;charset=utf-8",
                });
              }}
              disabled={!output}
              >
              Download .md
            </button>
            <button
              className="buttonSecondary"
              onClick={async () => {
                try {
                  const base = buildResumeFilenameBase();
                  await downloadDocx(base);
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

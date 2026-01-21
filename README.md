# Resume Tailor

Resume Tailor is a lightweight web application that transforms an existing resume into a job-specific, professionally rewritten version powered by AI. It performs structured extraction, aligns the content to the job listing, and exports polished Markdown or DOCX resumes that are recruiter-ready and consistent.

The app is intentionally simple, fast, and focused — built for people who apply to many roles and want a repeatable way to generate clean resumes without hallucinations or fluff.

---

## What it does

1. Paste an existing resume or skills dump  
2. Paste a job listing  
3. (Optional) Provide your name + contact info  
4. Generate a tailored resume written from structured extracted facts  
5. Export in clean Markdown or professionally formatted Word (.docx)  

Exported files follow an intelligent naming format:

```
FIRST_LAST_COMPANY_Resume.docx
```

Perfect for keeping applications organized.

---

## Key Features

### 🧠 Two-Pass AI Pipeline
**Pass 1:** Extract structured resume facts into JSON  
**Pass 2:** Compose a clean, job-relevant resume using ONLY extracted data

This dramatically reduces hallucinations and ensures consistency.

### 🪪 Clean, Controlled Output
- No em dashes  
- No invented facts or inflated metrics  
- Short, impactful bullets  
- Proper section formatting  
- Age-bias-aware trimming rules  
- Tone and emphasis controls  

### 📝 Professional DOCX Export
The exported Word file includes:
- Centered name
- Optional contact line (location | phone | email | LinkedIn)
- Beautiful section headers with color accents
- Bullet spacing tuned for readability
- Multi-column **skills table** for space efficiency
- Improved education formatting (bold degree, italic institution)

### 📄 Markdown Export
- Pure Markdown suitable for ATS systems or GitHub storage
- No extra commentary
- Resume-only output

### 🎨 Simple, Fast UI
- React (Vite)
- Minimal CSS
- No heavy frameworks
- Collapsible Contact Info panel

### 🛡️ Safe Input Controls
- Zod validation  
- Server-side size limits  
- Token-friendly truncation (planned)

---

## Tech Stack

### **Frontend**
- React (Vite)
- Vanilla CSS

### **Backend**
- Node.js / Express
- OpenAI Chat Completions API
- Zod schema validation

### **Document Export**
- `docx` for constructing fully styled Word documents

---

## Project Structure

```bash
/server
  /prompts
    extractPrompt.md
    composePrompt.md
  exportDocx.js
  extractSchema.js
  index.js
  prompt.js   

/web
  src/
    App.jsx
    App.css
    main.jsx
```

---

## Local Development

### Prerequisites
- Node.js 18+
- npm
- OpenAI API key

### Setup Instructions

#### Backend
```bash
cd server
npm install
npm run dev
```

Create `.env`:

```bash
OPENAI_API_KEY=your_api_key_here
LLM_MODEL=gpt-5.2-mini
```

#### Frontend
```bash
cd web
npm install
npm run dev
```

Visit:

```bash
http://localhost:5173
```

---

## Notes

- All prompts are externalized so you can iterate freely.
- DOCX export is carefully tuned to create visually consistent, recruiter-friendly resumes.
- The app does **not** long-term storage; everything is client-side or in-memory.

---

## Future Ideas

### 🚀 Product Enhancements
- **Alternate resume modes** (Product, Technical, Leadership)
- **Skill match scoring** against the job posting
- **Highlight missing skills** for upskilling guidance
- **Export to PDF**
- **Built-in Markdown preview**
- **Multiple base resume profiles** (e.g., PM, IC, leadership)
- **Interview tips** to help prepare for the interview
- **Authentication** to allow for the storage of skill lists and contact details

### 🤖 AI Improvements
- Model-driven **resume shortening** to enforce 1-page mode  
- **Job similarity scoring** for prioritizing applications  
- **“Punch up my achievements” mode** (rewrite bullets to be more outcome-focused using existing facts only)

### 🧩 Integrations
- LinkedIn job import  
- Greenhouse / Lever / Indeed copy-paste cleanup  
- GitHub Pages / static hosting for sharing the tool with others

---
# Resume Tailor

Resume Tailor is a lightweight web application that helps generate a job-specific resume by tailoring an existing resume or skills dump to a specific job listing using AI. The app focuses on producing clean, professional output that can be exported and reused when applying to multiple roles.

---

## What it does

1. Paste an existing resume or skills dump  
2. Paste a job listing  
3. Choose a tone and emphasis  
4. Generate a tailored resume focused on relevant experience  
5. Export the result as Markdown or Word  

Exported files are automatically named using the candidate’s name and target company to make applying to multiple roles easier.

---

## Features

- AI-powered resume tailoring based on a job listing  
- Emphasis control (impact, skills, leadership)  
- Clean, non “AI-sounding” output (no em dashes, minimal fluff) 
- Content controls to prevent hallucinations and false information 
- Export formats:
  - Markdown (.md)
  - Word (.docx)
- Professional, consistent file naming  
- Simple React UI with no heavy frontend framework  

---

## Tech Stack

**Frontend**
- React (Vite)
- Plain CSS (no Tailwind or UI frameworks)

**Backend**
- Node.js
- Express
- OpenAI API
- Zod (request validation)

**Document Export**
- docx (Word document generation)

---

## Project Structure

```
/server
  /prompts
    resumePrompt.md
  exportDocx.js
  index.js
  prompt.js

/web
  src/
    App.jsx
    App.css
```

---

## Local Development

### Prerequisites

- Node.js
- npm
- OpenAI API key

### Setup

Clone the repository and install dependencies.

**Server**

```
cd server
npm install
npm run dev
```

Create a `.env` file in the `server` directory:

```
OPENAI_API_KEY=your_api_key_here
LLM_MODEL=chosen_gpt_model_here
```

**Web**

```
cd web
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Notes

- This project is intentionally simple and focused.
- Prompts are externalized for easy iteration.
- Designed as a practical resume-tailoring tool, not a resume generator from scratch.

---

## Future Ideas

- Two-pass generation for improved content quality
- Keyword coverage and gap analysis
- Markdown preview
- Resume versioning per job or company

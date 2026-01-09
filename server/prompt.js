import fs from "fs";
import path from "path";

const resumePromptPath = path.join(process.cwd(), "prompts", "resumePrompt.md");
const extractPromptPath = path.join(process.cwd(), "prompts", "extractPrompt.md");
const composePromptPath = path.join(process.cwd(), "prompts", "composePrompt.md");

const resumeTemplate = fs.readFileSync(resumePromptPath, "utf8");
const extractTemplate = fs.readFileSync(extractPromptPath, "utf8");
const composeTemplate = fs.readFileSync(composePromptPath, "utf8");

export function renderExtractPrompt({ baseResume, jobListing }) {
  const tokens = {
    BASE_RESUME: baseResume ?? "",
    JOB_LISTING: jobListing ?? "",
  };

  return extractTemplate.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => tokens[key] ?? "");
}

export function renderResumePrompt({ baseResume, jobListing, tone, emphasis, noEmDashes }) {
  const tokens = {
    BASE_RESUME: baseResume ?? "",
    JOB_LISTING: jobListing ?? "",
    TONE: tone ?? "neutral",
    EMPHASIS: emphasis ?? "impact",
    NO_EM_DASHES_RULE: (noEmDashes ?? true) ? "- Do not use em dashes (—)." : "",
  };

    return resumeTemplate.replace( /{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => tokens[key] ?? "" );
}

export function renderComposePrompt({ extractJson }) {
  return composeTemplate.replace(
    /{{\s*EXTRACT_JSON\s*}}/g,
    JSON.stringify(extractJson, null, 2)
  );
}


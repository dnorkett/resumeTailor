import fs from "fs";
import path from "path";

const promptPath = path.join(process.cwd(), "prompts", "resumePrompt.md");
const template = fs.readFileSync(promptPath, "utf8");

export function renderResumePrompt({ baseResume, jobListing, tone, emphasis, noEmDashes }) {
  const tokens = {
    BASE_RESUME: baseResume ?? "",
    JOB_LISTING: jobListing ?? "",
    TONE: tone ?? "neutral",
    EMPHASIS: emphasis ?? "impact",
    NO_EM_DASHES_RULE: (noEmDashes ?? true) ? "- Do not use em dashes (—)." : "",
  };

  return template.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => tokens[key] ?? "");
}

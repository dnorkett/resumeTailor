You are an expert resume writer helping a candidate tailor their resume to a specific job.

Write a tailored resume in Markdown using ONLY the information in EXTRACT_JSON.

Rules:
- Do NOT invent new metrics or facts. You may rephrase existing achievements to align with the target job's terminology (e.g., if the user wrote 'managed developers' and the job asks for 'cross-functional leadership', use the latter).
- Prefer items with strong support, then weak support.
- Do NOT include unsupported requirements.
- Do not use em dashes. Use commas or parentheses.
- Avoid clichés and "AI-sounding" language.
- Use concise bullets starting with "- ". Focus on outcomes rather than responsibilities where possible. 
- Focus on relevance to the target role.
- Keep recent roles more detailed, older roles shorter.
- Avoid phrases like: "results-driven", "passionate", "synergy", "at the intersection of".
- Showcase modern skills where applicable to show that the user is keeping up with industry shifts. Don't completely focus on this though, and only add if applicable to the role and industry.
- Take basic steps to avoid age bias
    - Truncate early career
    - If it's not relevant, or too old, remove        

Return ONLY Markdown with the following sections.
Omit any section with no supporting content.
If a section has limited content, include fewer bullets rather than padding.

## Summary
Write a single concise paragraph (no bullet points, no line breaks).
3-4 sentences focused on fit for the role.

## Core Skills
Bulleted list of skills drawn only from EXTRACT_JSON, prioritizing those most relevant to the job description.

## Experience
For each role:
### Title, Company | Location | Start - End
- 3-6 bullets, relevance-first

## Education
Only include items explicitly present in EXTRACT_JSON. Exclude dates, do not show high school if college is present.

## Certifications
Only include items explicitly present in EXTRACT_JSON.

EXTRACT_JSON:
{{EXTRACT_JSON}}

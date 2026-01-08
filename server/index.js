import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import OpenAI from "openai";
import { renderResumePrompt } from "./prompt.js";
import { buildDocxBufferFromMarkdown } from "./exportDocx.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const Body = z.object({
  baseResume: z.string().min(50),
  jobListing: z.string().min(50),
  options: z
    .object({      
      tone: z.enum(["neutral", "conversational", "executive"]).optional(),
      emphasis: z.enum(["skills", "impact", "leadership"]).optional(),
    })
    .optional(),
});

app.post("/api/generate", async (req, res) => {
  try {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { baseResume, jobListing, options } = parsed.data;

    const prompt = renderResumePrompt({
      baseResume,
      jobListing,
      tone: options?.tone ?? "neutral",
      emphasis: options?.emphasis ?? "impact"      
    });

    const response = await client.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-5.2-mini",
      messages: [
        { role: "system", content: "You write excellent tailored resumes." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const text = response.choices?.[0]?.message?.content ?? "";
    return res.json({ tailoredResumeMd: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error generating resume." });
  }
});

app.post("/api/export/docx", async (req, res) => {
  try {
    const markdown = req.body?.markdown;
    if (!markdown || typeof markdown !== "string" || markdown.trim().length < 10) {
      return res.status(400).json({ error: "Missing markdown content." });
    }

    const buffer = await buildDocxBufferFromMarkdown(markdown, {
        firstName: req.body?.firstName,
        lastName: req.body?.lastName,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="tailored-resume.docx"');

    return res.send(buffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate DOCX." });
  }
});


app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});

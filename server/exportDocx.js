import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

const COLOR_HEADER = "2E3A46"; // slate blue
const COLOR_BODY = "0F172A"; // near-black

function cleanLine(s) {
  return String(s || "").trimEnd();
}

// Detect section headings even if the model doesn't use "#"
function isSectionHeading(line) {
  const t = line.trim();
  if (!t) return false;

  const known = [
    "SUMMARY",
    "CORE SKILLS",
    "SKILLS",
    "EXPERIENCE",
    "EDUCATION",
    "CERTIFICATIONS",
    "PROJECTS",
  ];

  const upper = t.replace(/:$/, "").toUpperCase();
  return known.includes(upper);
}

function sectionHeadingText(line) {
  return line.trim().replace(/:$/, "");
}

function buildNameLine(meta) {
  const fn = String(meta?.firstName || "").trim();
  const ln = String(meta?.lastName || "").trim();
  const full = `${fn} ${ln}`.trim();
  return full || null;
}

/**
 * Minimal inline Markdown parser:
 * - supports **bold**
 * (Good enough for resumes; we can extend later if needed.)
 */
function runsFromMarkdownInline(text) {
  const s = String(text || "");
  const parts = s.split("**");

  const runs = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    runs.push(
      new TextRun({
        text: part,
        bold: i % 2 === 1, // odd indices are inside ** **
      })
    );
  }

  return runs.length ? runs : [new TextRun(s)];
}

function boldRunsSized(text, sizeHalfPoints, color) {
  // Strips ** and forces bold at a specific size
  const cleaned = String(text || "").replace(/\*\*/g, "");
  return [
    new TextRun({
      text: cleaned,
      bold: true,
      size: sizeHalfPoints,
      ...(color ? { color } : {}),
    }),
  ];
}

/**
 * Converts markdown-ish resume content into docx Paragraph objects.
 * Supports:
 * - #, ##, ### headings
 * - Section headings without # (e.g., "Experience")
 * - Bullets: "- ", "* ", and common bullet characters like "●" / "•"
 * - Inline bold via **text**
 *
 * Additional formatting normalization:
 * - Removes blank lines immediately after section headings (## Experience -> ### Role)
 */
function markdownToParagraphs(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const paragraphs = [];
  let lastWasSectionHeading = false;

  for (const raw of lines) {
    const line = cleanLine(raw);

    // Blank line handling
    if (!line.trim()) {
      // Skip blank lines immediately after section headings (e.g. "## Experience")
      if (lastWasSectionHeading) {
        continue;
      }

      paragraphs.push(
        new Paragraph({
          children: [new TextRun("")],
          spacing: { after: 90 },
        })
      );
      continue;
    }

    // Any non-blank line resets the "blank-after-heading" suppression state,
    // except we re-enable it on heading branches below.
    lastWasSectionHeading = false;

    // Section headings even without #
    if (isSectionHeading(line)) {
      const text = sectionHeadingText(line);
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text.toUpperCase(),
              bold: true,
              color: COLOR_HEADER,
            }),
          ],
          spacing: { before: 120, after: 60 },
          border: {
            bottom: { color: "D9E1EC", size: 6, space: 10 },
          },
        })
      );
      lastWasSectionHeading = true;
      continue;
    }

    // Markdown headings
    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          children: boldRunsSized(line.slice(2).trim(), 30, COLOR_HEADER), // 15pt, header color
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 110 },
        })
      );
      lastWasSectionHeading = true;
      continue;
    }

    if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          children: boldRunsSized(line.slice(3).trim(), 26, COLOR_HEADER), // 13pt, header color
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 60 },
        })
      );
      lastWasSectionHeading = true;
      continue;
    }

    // Job title lines often come through as ### ...
    if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          children: boldRunsSized(line.slice(4).trim(), 22), // 11pt, near-black (default)
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 90, after: 24 },
        })
      );
      // Do NOT set lastWasSectionHeading here; we want spacing between sections and roles,
      // but not to suppress content following roles.
      continue;
    }

    // Bullets: "-", "*", plus "●" / "•" / other common bullet glyphs
    const isDashBullet = line.startsWith("- ") || line.startsWith("* ");
    const isDotBullet = /^([•●‣◦])\s+/.test(line.trimStart());

    if (isDashBullet || isDotBullet) {
      const content = isDashBullet
        ? line.slice(2).trim()
        : line.trimStart().replace(/^([•●‣◦])\s+/, "");

      paragraphs.push(
        new Paragraph({
          children: runsFromMarkdownInline(content),
          bullet: { level: 0 },
          spacing: { after: 24 },
        })
      );
      continue;
    }

    // Normal paragraph (supports inline **bold**)
    paragraphs.push(
      new Paragraph({
        children: runsFromMarkdownInline(line),
        spacing: { after: 60 },
      })
    );
  }

  return paragraphs;
}

export async function buildDocxBufferFromMarkdown(markdown, meta = {}) {
  const nameLine = buildNameLine(meta);

  const header = [];
  if (nameLine) {
    header.push(
      new Paragraph({
        children: [
          new TextRun({
            text: nameLine,
            bold: true,
            size: 36, // 18pt (docx uses half-points)
            color: COLOR_HEADER,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

  const body = markdownToParagraphs(markdown);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
            color: COLOR_BODY,
          },
          paragraph: {
            spacing: { line: 276 }, // ~1.15
          },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 30 }, // 15pt
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 26 }, // 13pt
          paragraph: { spacing: { before: 220, after: 90 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 22 }, // 11pt
          paragraph: { spacing: { before: 160, after: 60 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5"
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [...header, ...body],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

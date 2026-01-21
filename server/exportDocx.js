import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, } from "docx";

const COLOR_HEADER = "2E3A46"; // slate blue
const COLOR_BODY = "0F172A";   // near-black

// Global spacing constants (in twips-related units used by docx)
const SPACING_PARAGRAPH_AFTER = 40; // general paragraphs
const SPACING_BULLET_AFTER = 4;    // normal bullets
const SPACING_SKILL_ROW_MARGIN = 10; // padding inside skills table cells

// Reusable "no borders" config for cells
const BORDER_NONE = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

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

function normalizePhone(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  // Keep only digits
  const digits = raw.replace(/\D/g, "");

  // Handle US numbers:
  // - 10 digits: (AAA) BBB-CCCC
  // - 11 digits starting with 1: treat as US country code
  let d = digits;
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);

  if (d.length === 10) {
    const area = d.slice(0, 3);
    const prefix = d.slice(3, 6);
    const line = d.slice(6);
    return `(${area}) ${prefix}-${line}`;
  }

  // If it's not a standard US 10-digit number, don't guess.
  // Return the user's original trimmed input.
  return raw;
}

function normalizeLinkedIn(input) {
  let s = String(input || "").trim();
  if (!s) return "";

  // Strip common prefixes like "LinkedIn:" if someone pastes a labeled line
  s = s.replace(/^linkedin\s*[:\-–—]\s*/i, "").trim();

  // If it's already a URL, use as-is
  if (/^https?:\/\//i.test(s)) return s;

  // If it's a LinkedIn domain (with or without www), just add https://
  if (/^(www\.)?linkedin\.com\//i.test(s)) return `https://${s}`;

  // If user gave "in/handle" or "/in/handle"
  s = s.replace(/^\/+/, "");
  if (/^in\//i.test(s)) return `https://linkedin.com/${s}`;

  // Otherwise treat it as a handle (e.g., "youa" or "@youa")
  const handle = s.replace(/^@/, "").replace(/\s+/g, "");
  return `https://linkedin.com/in/${handle}`;
}

function renderEducationLine(line) {
  // Degree + field + institution usually come on one line
  // Example:
  // Bachelor of Business Administration, Accounting — University Texas

  const cleaned = line.replace(/\*\*/g, "");

  // Split only on common "separator" patterns between degree and institution.
  // - em dash (—), en dash (–), pipe (|), or a hyphen surrounded by spaces (" - ")
  const parts = cleaned
    .split(/\s*(?:—|–|\|)\s*|\s-\s/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const degreePart = parts[0] ?? "";
  const institutionPart = parts[1] ?? "";

  const paragraphs = [];

  if (degreePart) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: degreePart,
            bold: true,
          }),
        ],
        spacing: { after: 30 },
      })
    );
  }

  if (institutionPart) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: institutionPart,
            italics: true,
          }),
        ],
        spacing: { after: 40 },
      })
    );
  }

  return paragraphs;
}

function buildContactLine(meta = {}) {
  const location = String(meta.location || "").trim();
  const phone = normalizePhone(meta.phone);
  const email = String(meta.email || "").trim();
  const linkedIn = normalizeLinkedIn(meta.linkedIn);

  const parts = [location, phone, email, linkedIn].filter(Boolean);
  return parts.length ? parts.join(" | ") : null;
}

function chooseSkillsColumns(count) {
  // Simple heuristic:
  // - 2 columns if shorter list
  // - 3 columns if longer list
  return count >= 9 ? 3 : 2;
}

function makeSkillsTable(skills, columns) {
  const rows = [];

  // Chunk skills into rows of [col1, col2, col3]
  for (let i = 0; i < skills.length; i += columns) {
    const slice = skills.slice(i, i + columns);

    const cells = [];
    for (let c = 0; c < columns; c++) {
      const text = slice[c] || "";

      cells.push(
        new TableCell({
          width: { size: 100 / columns, type: WidthType.PERCENTAGE },
          margins: {
            top: SPACING_SKILL_ROW_MARGIN,
            bottom: SPACING_SKILL_ROW_MARGIN,
            left: 80,
            right: 80,
          },
          borders: BORDER_NONE,
          children: [
            new Paragraph({
              children: text
                ? [
                    new TextRun({ text: "• " }),
                    ...runsFromMarkdownInline(text),
                  ]
                : [],
              spacing: {
                before: 0,
                after: SPACING_BULLET_AFTER,   // 👈 use the global bullet spacing
              },
            }),
          ],
        })
      );
    }

    rows.push(
      new TableRow({
        children: cells,
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideH: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideV: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows,
  });
}


/**
 * Converts markdown-ish resume content into docx blocks (Paragraphs and Tables).
 */
function markdownToParagraphs(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = []; // Paragraph | Table
  let lastWasSectionHeading = false;
  let inEducationSection = false;

  let inSkillsSection = false;
  let skillsItems = [];

  function flushSkillsIfNeeded() {
    if (!inSkillsSection) return;
    inSkillsSection = false;

    if (skillsItems.length) {
      const cols = chooseSkillsColumns(skillsItems.length);
      blocks.push(makeSkillsTable(skillsItems, cols));

      // Small spacing after the table so the next section isn't glued to it
      blocks.push(
        new Paragraph({
          children: [new TextRun("")],
          spacing: { after: 40 },
        })
      );
    }

    skillsItems = [];
  }

  for (const raw of lines) {
    const line = cleanLine(raw);

    // Blank line handling
    if (!line.trim()) {
      if (lastWasSectionHeading) {
        continue;
      }

      // If we’re in skills, ignore blank lines so we don’t create extra gaps
      if (inSkillsSection) continue;

      blocks.push(
        new Paragraph({
          children: [new TextRun("")],
          spacing: { after: SPACING_PARAGRAPH_AFTER },
        })
      );
      continue;
    }

    lastWasSectionHeading = false;

    // Section headings without #
    if (isSectionHeading(line)) {
      // If we hit a new section, flush skills table before switching
      flushSkillsIfNeeded();

      const text = sectionHeadingText(line);
      const upper = text.toUpperCase();

      inEducationSection = upper === "EDUCATION";
      inSkillsSection = upper === "CORE SKILLS" || upper === "SKILLS";

      blocks.push(
        new Paragraph({
          children: [
            new TextRun({
              text: upper,
              bold: true,
              color: COLOR_HEADER,
            }),
          ],
          spacing: { before: 40, after: 20 },
          border: { bottom: { color: "D9E1EC", size: 6, space: 10 } },
        })
      );

      lastWasSectionHeading = true;
      continue;
    }

    // Markdown headings (# / ## / ###)
    if (line.startsWith("# ")) {
      flushSkillsIfNeeded();

      blocks.push(
        new Paragraph({
          children: boldRunsSized(line.slice(2).trim(), 30, COLOR_HEADER),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 220, after: 90 },
        })
      );
      lastWasSectionHeading = true;
      continue;
    }

    if (line.startsWith("## ")) {
      flushSkillsIfNeeded();

      const headingText = line.slice(3).trim();
      const upper = headingText.toUpperCase();

      inEducationSection = upper === "EDUCATION";
      inSkillsSection = upper === "CORE SKILLS" || upper === "SKILLS";

      blocks.push(
        new Paragraph({
          children: boldRunsSized(headingText, 26, COLOR_HEADER),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 40 },
        })
      );
      lastWasSectionHeading = true;
      continue;
    }

    if (line.startsWith("### ")) {
      flushSkillsIfNeeded();

      blocks.push(
        new Paragraph({
          children: boldRunsSized(line.slice(4).trim(), 22),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 70, after: 20 },
        })
      );
      continue;
    }

    // Bullets
    const isDashBullet = line.startsWith("- ") || line.startsWith("* ");
    const isDotBullet = /^([•●‣◦])\s+/.test(line.trimStart());

    if (isDashBullet || isDotBullet) {
      const content = isDashBullet
        ? line.slice(2).trim()
        : line.trimStart().replace(/^([•●‣◦])\s+/, "");

      // If we’re in Skills section, collect bullets instead of rendering normal bullets
      if (inSkillsSection) {
        skillsItems.push(content);
        continue;
      }

    blocks.push(
      new Paragraph({
        children: runsFromMarkdownInline(content),
        bullet: { level: 0 },
        spacing: {
          before: 0,
          after: SPACING_BULLET_AFTER,
        },
      })
    );
    continue;

    }

    // Education formatting
    if (inEducationSection && !line.startsWith("- ") && !line.startsWith("* ")) {
      const eduParagraphs = renderEducationLine(line);
      blocks.push(...eduParagraphs);
      continue;
    }

    // If we’re in Skills section and we got a non-bullet line, treat it as a skill entry
    if (inSkillsSection) {
      skillsItems.push(line.trim());
      continue;
    }

    // Normal paragraph
    blocks.push(
      new Paragraph({
        children: runsFromMarkdownInline(line),
        spacing: { after: SPACING_PARAGRAPH_AFTER },
      })
    );
  }

  // End of doc: flush skills if the resume ends after skills
  flushSkillsIfNeeded();

  return blocks;
}

export async function buildDocxBufferFromMarkdown(markdown, meta = {}) {
  const nameLine = buildNameLine(meta);
  const contactLine = buildContactLine(meta);

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
        spacing: { after: contactLine ? 30 : 100 },
      })
    );
  }

  if (contactLine) {
    header.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactLine,
            size: 20, // 10pt
            color: COLOR_BODY,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
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
            spacing: { line: 276 }, // ~1.15 line height
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
          paragraph: { spacing: { before: 220, after: 100 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 26 }, // 13pt
          paragraph: { spacing: { before: 180, after: 70 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 22 }, // 11pt
          paragraph: { spacing: { before: 70, after: 30 } },
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

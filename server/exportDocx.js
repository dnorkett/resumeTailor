import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

/**
 * Very simple Markdown-ish parser:
 * - "# " => Heading 1
 * - "## " => Heading 2
 * - "- " or "* " => bullet
 * - blank line => spacing
 * - everything else => normal paragraph
 *
 * This is intentionally minimal for v1. 
 */

function markdownToParagraphs(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");

  const paragraphs = [];

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      // Add a small spacer paragraph
      paragraphs.push(new Paragraph({ children: [new TextRun("")], spacing: { after: 120 } }));
      continue;
    }

    if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: line.slice(3).trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        })
      );
      continue;
    }

    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: line.slice(2).trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 140 },
        })
      );
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      paragraphs.push(
        new Paragraph({
          text: line.slice(2).trim(),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
      continue;
    }

    // Normal paragraph
    paragraphs.push(
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 120 },
      })
    );
  }

  return paragraphs;
}

export async function buildDocxBufferFromMarkdown(markdown) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: markdownToParagraphs(markdown),
      },
    ],
  });

  // Returns a Node Buffer
  return await Packer.toBuffer(doc);
}

import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Formata conteúdo para ePub/PDF — processamento local

interface BookChapter {
  number: number;
  title: string;
  content: string;
}

function generateEpubHtml(
  title: string,
  author: string,
  chapters: BookChapter[]
): string {
  const chapterHtml = chapters
    .map(
      (ch) => `
    <div class="chapter">
      <h2>Capítulo ${ch.number}: ${ch.title}</h2>
      ${ch.content
        .split("\n")
        .map((p) => `<p>${p}</p>`)
        .join("\n")}
    </div>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${title}</title>
  <meta name="author" content="${author}" />
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; margin: 2em; }
    h1 { text-align: center; margin-bottom: 2em; }
    h2 { page-break-before: always; margin-top: 2em; }
    p { text-indent: 1.5em; margin: 0.5em 0; }
    .chapter { margin-bottom: 3em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p style="text-align:center"><em>por ${author}</em></p>
  ${chapterHtml}
</body>
</html>`;
}

export const publishBookToEpub: ToolDefinition = {
  name: "publish_book_to_epub",
  description: "Converter livro gerado para formato ePub (XHTML)",
  inputSchema: z.object({
    title: z.string(),
    author: z.string(),
    chapters: z.array(
      z.object({
        number: z.number(),
        title: z.string(),
        content: z.string(),
      })
    ),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const html = generateEpubHtml(
        input.title as string,
        input.author as string,
        input.chapters as BookChapter[]
      );
      return makeSuccessResponse(taskId, {
        format: "epub-xhtml",
        title: input.title,
        html,
        chapters: (input.chapters as BookChapter[]).length,
      });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const publishBookToPdf: ToolDefinition = {
  name: "publish_book_to_pdf",
  description: "Converter livro para formato PDF (gera HTML pronto para conversão)",
  inputSchema: z.object({
    title: z.string(),
    author: z.string(),
    chapters: z.array(
      z.object({
        number: z.number(),
        title: z.string(),
        content: z.string(),
      })
    ),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const html = generateEpubHtml(
        input.title as string,
        input.author as string,
        input.chapters as BookChapter[]
      );
      return makeSuccessResponse(taskId, {
        format: "pdf-ready-html",
        title: input.title,
        html,
        note: "HTML pronto para conversão para PDF via puppeteer ou wkhtmltopdf",
      });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const publishKindleTools: ToolDefinition[] = [
  publishBookToEpub,
  publishBookToPdf,
];

import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";
import { sleep } from "../../utils.js";

// Gera livros capítulo a capítulo via Groq para não ultrapassar limites de tokens
const GROQ_API = "https://api.groq.com/openai/v1";

function groqHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function generateChapter(
  bookTitle: string,
  chapterNumber: number,
  chapterTitle: string,
  outline: string,
  language: string,
  model: string
): Promise<string> {
  const res = (await httpPost(
    `${GROQ_API}/chat/completions`,
    {
      model,
      messages: [
        {
          role: "system",
          content: `És um escritor profissional. Escreve em ${language}. Gera o capítulo ${chapterNumber} do livro "${bookTitle}". O capítulo chama-se "${chapterTitle}". Segue o outline fornecido. Escreve conteúdo rico, detalhado e com pelo menos 2000 palavras.`,
        },
        {
          role: "user",
          content: `Outline do livro:\n${outline}\n\nGera o capítulo ${chapterNumber}: "${chapterTitle}"`,
        },
      ],
      max_tokens: 8000,
      temperature: 0.8,
    },
    groqHeaders()
  )) as Record<string, unknown>;

  const choices = res.choices as Array<Record<string, unknown>>;
  const message = choices?.[0]?.message as Record<string, unknown>;
  return (message?.content as string) || "";
}

export const publishBookGenerate: ToolDefinition = {
  name: "publish_book_generate",
  description: "Gerar livro completo capítulo a capítulo via Groq",
  inputSchema: z.object({
    title: z.string(),
    chapters: z.array(z.string()).describe("Lista de títulos dos capítulos"),
    outline: z.string().describe("Outline/resumo geral do livro"),
    language: z.string().default("pt"),
    model: z.string().default("llama-3.1-70b-versatile"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const chapters: Array<{ number: number; title: string; content: string }> = [];
      const chapterTitles = input.chapters as string[];

      for (let i = 0; i < chapterTitles.length; i++) {
        const content = await generateChapter(
          input.title as string,
          i + 1,
          chapterTitles[i],
          input.outline as string,
          input.language as string,
          input.model as string
        );
        chapters.push({
          number: i + 1,
          title: chapterTitles[i],
          content,
        });
        // Respeitar rate limits entre capítulos
        if (i < chapterTitles.length - 1) {
          await sleep(2000);
        }
      }

      return makeSuccessResponse(taskId, {
        book: {
          title: input.title,
          totalChapters: chapters.length,
          chapters,
        },
      });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const publishBookTools: ToolDefinition[] = [publishBookGenerate];

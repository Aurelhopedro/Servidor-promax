import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito Brevo: 300 emails/dia
const BREVO_API = "https://api.brevo.com/v3";

function brevoHeaders(): Record<string, string> {
  return {
    "api-key": process.env.BREVO_API_KEY || "",
    "Content-Type": "application/json",
  };
}

export const marketingBrevoSendEmail: ToolDefinition = {
  name: "marketing_brevo_send_email",
  description: "Enviar email transacional via Brevo",
  inputSchema: z.object({
    to: z.array(z.object({ email: z.string(), name: z.string().optional() })),
    subject: z.string(),
    htmlContent: z.string(),
    senderName: z.string().default("MCP Agregador"),
    senderEmail: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${BREVO_API}/smtp/email`,
        {
          sender: { name: input.senderName, email: input.senderEmail },
          to: input.to,
          subject: input.subject,
          htmlContent: input.htmlContent,
        },
        brevoHeaders()
      );
      return makeSuccessResponse(taskId, { email: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingBrevoCreateContact: ToolDefinition = {
  name: "marketing_brevo_create_contact",
  description: "Criar contacto no Brevo",
  inputSchema: z.object({
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    listIds: z.array(z.number()).optional(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${BREVO_API}/contacts`,
        {
          email: input.email,
          attributes: {
            FIRSTNAME: input.firstName || "",
            LASTNAME: input.lastName || "",
          },
          listIds: input.listIds || [],
        },
        brevoHeaders()
      );
      return makeSuccessResponse(taskId, { contact: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingBrevoGetContacts: ToolDefinition = {
  name: "marketing_brevo_get_contacts",
  description: "Listar contactos do Brevo",
  inputSchema: z.object({
    limit: z.number().default(50),
    offset: z.number().default(0),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${BREVO_API}/contacts`,
        { limit: input.limit, offset: input.offset },
        brevoHeaders()
      );
      return makeSuccessResponse(taskId, { contacts: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingBrevoTools: ToolDefinition[] = [
  marketingBrevoSendEmail,
  marketingBrevoCreateContact,
  marketingBrevoGetContacts,
];

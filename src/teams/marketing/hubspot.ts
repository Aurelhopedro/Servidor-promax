import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types.js";
import { httpPost, httpGet, makeSuccessResponse, makeErrorResponse } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Limite gratuito HubSpot: CRM gratuito ilimitado, API 100 requests/10s
const HUBSPOT_API = "https://api.hubapi.com";

function hsHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export const marketingHubspotCreateContact: ToolDefinition = {
  name: "marketing_hubspot_create_contact",
  description: "Criar contacto no HubSpot CRM",
  inputSchema: z.object({
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${HUBSPOT_API}/crm/v3/objects/contacts`,
        {
          properties: {
            email: input.email,
            firstname: input.firstName || "",
            lastname: input.lastName || "",
            company: input.company || "",
            phone: input.phone || "",
          },
        },
        hsHeaders()
      );
      return makeSuccessResponse(taskId, { contact: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingHubspotGetContacts: ToolDefinition = {
  name: "marketing_hubspot_get_contacts",
  description: "Listar contactos do HubSpot",
  inputSchema: z.object({
    limit: z.number().default(10),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        `${HUBSPOT_API}/crm/v3/objects/contacts`,
        { limit: input.limit },
        hsHeaders()
      );
      return makeSuccessResponse(taskId, { contacts: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingHubspotCreateDeal: ToolDefinition = {
  name: "marketing_hubspot_create_deal",
  description: "Criar deal/negócio no HubSpot CRM",
  inputSchema: z.object({
    dealName: z.string(),
    amount: z.number().optional(),
    stage: z.string().default("appointmentscheduled"),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        `${HUBSPOT_API}/crm/v3/objects/deals`,
        {
          properties: {
            dealname: input.dealName,
            amount: input.amount?.toString() || "",
            dealstage: input.stage,
          },
        },
        hsHeaders()
      );
      return makeSuccessResponse(taskId, { deal: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const marketingHubspotTools: ToolDefinition[] = [
  marketingHubspotCreateContact,
  marketingHubspotGetContacts,
  marketingHubspotCreateDeal,
];

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../../http/api.js";
import { buildQuery, paginationHint, toolError, v2ApiKey } from "./helpers.js";

const pixDest = z
  .object({
    key: z.string(),
    type: z.enum(["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM", "BR_CODE"]),
  })
  .strict();

export function registerV2PixSendTools(server: McpServer) {
  server.tool(
    "v2SendPix",
    "Envia PIX para chave de terceiros (API v2).",
    {
      apiKey: v2ApiKey,
      amount: z.number().min(1),
      externalId: z.string(),
      pix: pixDest,
      description: z.string().optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const body: Record<string, unknown> = {
          amount: p.amount,
          externalId: p.externalId,
          pix: p.pix,
        };
        if (p.description) body.description = p.description;

        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: "/pix/send",
          apiKey: p.apiKey,
          method: "POST",
          body: JSON.stringify(body),
        });
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2GetPixTransaction",
    "Busca transação PIX por id ou externalId (API v2; informe ao menos um).",
    {
      apiKey: v2ApiKey,
      id: z.string().optional(),
      externalId: z.string().optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/pix/get${buildQuery({ id: p.id, externalId: p.externalId })}`,
          apiKey: p.apiKey,
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2ListPixTransactions",
    "Lista envios PIX (API v2).",
    {
      apiKey: v2ApiKey,
      after: z.string().optional(),
      before: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      id: z.string().optional(),
      externalId: z.string().optional(),
      status: z.enum(["PENDING", "EXPIRED", "CANCELLED", "COMPLETE", "REFUNDED"]).optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/pix/list${buildQuery({
            after: p.after,
            before: p.before,
            limit: p.limit,
            id: p.id,
            externalId: p.externalId,
            status: p.status,
          })}`,
          apiKey: p.apiKey,
          method: "GET",
        });
        const rows =
          res.data?.map((t: any, i: number) => `${i + 1}. ${t.id} — ${t.status}`).join("\n") ||
          "Nenhuma.";
        return { content: [{ type: "text", text: `${rows}${paginationHint(res.pagination)}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );
}

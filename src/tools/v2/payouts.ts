import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../../http/api.js";
import { buildQuery, paginationHint, toolError, v2ApiKey } from "./helpers.js";

export function registerV2PayoutTools(server: McpServer) {
  server.tool(
    "v2CreatePayout",
    "Cria payout para transferir da conta AbacatePay (API v2; não envia chave PIX no body).",
    {
      apiKey: v2ApiKey,
      amount: z.number().min(350),
      externalId: z.string(),
      description: z.string().optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const body: Record<string, unknown> = {
          amount: p.amount,
          externalId: p.externalId,
        };
        if (p.description) body.description = p.description;

        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: "/payouts/create",
          apiKey: p.apiKey,
          method: "POST",
          body: JSON.stringify(body),
        });
        const d = res.data;
        return {
          content: [
            {
              type: "text",
              text: `Payout ${d.id} — ${d.status} — ${d.amount} centavos — ext ${d.externalId}`,
            },
          ],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2GetPayout",
    "Busca payout por externalId (API v2).",
    {
      apiKey: v2ApiKey,
      externalId: z.string(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/payouts/get${buildQuery({ externalId: p.externalId })}`,
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
    "v2ListPayouts",
    "Lista payouts (API v2).",
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
          path: `/payouts/list${buildQuery({
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
          res.data?.map((t: any, i: number) => `${i + 1}. ${t.id} — ${t.status} — ${t.externalId}`).join("\n") ||
          "Nenhum payout.";
        return { content: [{ type: "text", text: `${rows}${paginationHint(res.pagination)}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );
}

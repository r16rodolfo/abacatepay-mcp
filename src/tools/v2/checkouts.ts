import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../../http/api.js";
import { buildQuery, paginationHint, toolError, v2ApiKey } from "./helpers.js";

const checkoutItem = z
  .object({
    id: z.string().describe("ID público do produto na loja (prod_...)"),
    quantity: z.number().min(1),
  })
  .strict();

export function registerV2CheckoutTools(server: McpServer) {
  server.tool(
    "v2CreateCheckout",
    "Cria checkout com itens de produto já cadastrados (API v2 — chave v2).",
    {
      apiKey: v2ApiKey,
      items: z.array(checkoutItem).min(1),
      methods: z.array(z.enum(["PIX", "CARD"])).min(1).optional(),
      returnUrl: z.string().url().optional(),
      completionUrl: z.string().url().optional(),
      customerId: z.string().optional(),
      coupons: z.array(z.string()).max(50).optional(),
      externalId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const body: Record<string, unknown> = { items: p.items };
        if (p.methods) body.methods = p.methods;
        if (p.returnUrl) body.returnUrl = p.returnUrl;
        if (p.completionUrl) body.completionUrl = p.completionUrl;
        if (p.customerId) body.customerId = p.customerId;
        if (p.coupons?.length) body.coupons = p.coupons;
        if (p.externalId) body.externalId = p.externalId;
        if (p.metadata) body.metadata = p.metadata;

        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: "/checkouts/create",
          apiKey: p.apiKey,
          method: "POST",
          body: JSON.stringify(body),
        });
        const d = res.data;
        return {
          content: [
            {
              type: "text",
              text: `Checkout criado\nID: ${d.id}\nURL: ${d.url}\nStatus: ${d.status}\nValor (centavos): ${d.amount}`,
            },
          ],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2ListCheckouts",
    "Lista checkouts (API v2).",
    {
      apiKey: v2ApiKey,
      after: z.string().optional(),
      before: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      id: z.string().optional(),
      externalId: z.string().optional(),
      status: z.enum(["PENDING", "EXPIRED", "CANCELLED", "PAID", "REFUNDED"]).optional(),
      email: z.string().optional(),
      taxId: z.string().optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/checkouts/list${buildQuery({
            after: p.after,
            before: p.before,
            limit: p.limit,
            id: p.id,
            externalId: p.externalId,
            status: p.status,
            email: p.email,
            taxId: p.taxId,
          })}`,
          apiKey: p.apiKey,
          method: "GET",
        });
        const rows =
          res.data?.map((b: any, i: number) => `${i + 1}. ${b.id} — ${b.status} — R$ ${(b.amount / 100).toFixed(2)}`).join(
            "\n"
          ) || "Nenhum checkout.";
        return { content: [{ type: "text", text: `${rows}${paginationHint(res.pagination)}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2GetCheckout",
    "Obtém um checkout por id (API v2).",
    {
      apiKey: v2ApiKey,
      id: z.string(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/checkouts/get${buildQuery({ id: p.id })}`,
          apiKey: p.apiKey,
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );
}

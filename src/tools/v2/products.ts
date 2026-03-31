import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../../http/api.js";
import { buildQuery, paginationHint, toolError, v2ApiKey } from "./helpers.js";

export function registerV2ProductTools(server: McpServer) {
  server.tool(
    "v2CreateProduct",
    "Cria produto para usar em checkouts (API v2).",
    {
      apiKey: v2ApiKey,
      externalId: z.string(),
      name: z.string(),
      price: z.number(),
      currency: z.enum(["BRL"]).default("BRL"),
      description: z.string().optional(),
      imageUrl: z.union([z.string().url(), z.null()]).optional(),
      cycle: z
        .enum(["WEEKLY", "MONTHLY", "SEMIANNUALLY", "ANNUALLY"])
        .nullable()
        .optional()
        .describe("Null ou omitido = produto avulso"),
    },
    async (params) => {
      const p = params as any;
      try {
        const body: Record<string, unknown> = {
          externalId: p.externalId,
          name: p.name,
          price: p.price,
          currency: p.currency ?? "BRL",
        };
        if (p.description != null) body.description = p.description;
        if (p.imageUrl !== undefined) body.imageUrl = p.imageUrl;
        if (p.cycle !== undefined) body.cycle = p.cycle;

        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: "/products/create",
          apiKey: p.apiKey,
          method: "POST",
          body: JSON.stringify(body),
        });
        const d = res.data;
        return {
          content: [{ type: "text", text: `Produto ${d.id} — ${d.name} — ${d.price} centavos — ciclo: ${d.cycle ?? "avulso"}` }],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2ListProducts",
    "Lista produtos (API v2).",
    {
      apiKey: v2ApiKey,
      after: z.string().optional(),
      before: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      id: z.string().optional(),
      externalId: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/products/list${buildQuery({
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
          res.data?.map((x: any, i: number) => `${i + 1}. ${x.id} — ${x.name} — ${x.status}`).join("\n") ||
          "Nenhum produto.";
        return { content: [{ type: "text", text: `${rows}${paginationHint(res.pagination)}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2GetProduct",
    "Busca produto por id ou externalId (API v2).",
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
          path: `/products/get${buildQuery({ id: p.id, externalId: p.externalId })}`,
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
    "v2DeleteProduct",
    "Remove produto (API v2).",
    {
      apiKey: v2ApiKey,
      id: z.string(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/products/delete${buildQuery({ id: p.id })}`,
          apiKey: p.apiKey,
          method: "POST",
          body: "{}",
        });
        return { content: [{ type: "text", text: `Produto removido: ${res.data?.id ?? p.id}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );
}

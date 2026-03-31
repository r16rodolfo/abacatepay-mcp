import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../../http/api.js";
import { buildQuery, paginationHint, toolError, v2ApiKey } from "./helpers.js";

export function registerV2CustomerTools(server: McpServer) {
  server.tool(
    "v2CreateCustomer",
    "Cria um cliente (API v2 — exige chave v2). Apenas email é obrigatório.",
    {
      apiKey: v2ApiKey,
      email: z.string().email(),
      name: z.string().optional(),
      cellphone: z.string().optional(),
      taxId: z.string().optional(),
      zipCode: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    },
    async (params, extra) => {
      const { apiKey, email, name, cellphone, taxId, zipCode, metadata } = params as any;
      try {
        const body: Record<string, unknown> = { email };
        if (name) body.name = name;
        if (cellphone) body.cellphone = cellphone;
        if (taxId) body.taxId = taxId;
        if (zipCode) body.zipCode = zipCode;
        if (metadata) body.metadata = metadata;

        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: "/customers/create",
          apiKey,
          sessionId: extra.sessionId,
          method: "POST",
          body: JSON.stringify(body),
        });
        const d = res.data;
        return {
          content: [
            {
              type: "text",
              text: `Cliente criado: ${d.id}\nemail: ${d.email}\nnome: ${d.name ?? "—"}`,
            },
          ],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2ListCustomers",
    "Lista clientes com paginação (API v2 — chave v2).",
    {
      apiKey: v2ApiKey,
      after: z.string().optional(),
      before: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      id: z.string().optional(),
      email: z.string().optional(),
      taxId: z.string().optional(),
    },
    async (params, extra) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/customers/list${buildQuery({
            after: p.after,
            before: p.before,
            limit: p.limit,
            id: p.id,
            email: p.email,
            taxId: p.taxId,
          })}`,
          apiKey: p.apiKey,
          sessionId: extra.sessionId,
          method: "GET",
        });
        const rows =
          res.data?.map((c: any, i: number) => `${i + 1}. ${c.id} — ${c.email} — ${c.name ?? ""}`).join("\n") ||
          "Nenhum cliente.";
        return {
          content: [
            {
              type: "text",
              text: `${rows}${paginationHint(res.pagination)}`,
            },
          ],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2GetCustomer",
    "Busca um cliente por id (API v2).",
    {
      apiKey: v2ApiKey,
      id: z.string().optional(),
    },
    async (params, extra) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/customers/get${buildQuery({ id: p.id })}`,
          apiKey: p.apiKey,
          sessionId: extra.sessionId,
          method: "GET",
        });
        const d = res.data;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(d, null, 2),
            },
          ],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2DeleteCustomer",
    "Remove um cliente por id (API v2; irreversível).",
    {
      apiKey: v2ApiKey,
      id: z.string(),
    },
    async (params, extra) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/customers/delete${buildQuery({ id: p.id })}`,
          apiKey: p.apiKey,
          sessionId: extra.sessionId,
          method: "POST",
          body: "{}",
        });
        return {
          content: [
            {
              type: "text",
              text: `Cliente removido: ${res.data?.id ?? p.id}`,
            },
          ],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );
}

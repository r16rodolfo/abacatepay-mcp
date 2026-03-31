import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../../http/api.js";
import { buildQuery, paginationHint, toolError, v2ApiKey } from "./helpers.js";

export function registerV2CouponTools(server: McpServer) {
  server.tool(
    "v2CreateCoupon",
    "Cria cupom (API v2 — chave v2).",
    {
      apiKey: v2ApiKey,
      code: z.string(),
      discountKind: z.enum(["PERCENTAGE", "FIXED"]),
      discount: z.number(),
      notes: z.string().optional(),
      maxRedeems: z.number().optional(),
      metadata: z.record(z.unknown()).optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const body: Record<string, unknown> = {
          code: p.code,
          discountKind: p.discountKind,
          discount: p.discount,
        };
        if (p.notes != null) body.notes = p.notes;
        if (p.maxRedeems != null) body.maxRedeems = p.maxRedeems;
        if (p.metadata) body.metadata = p.metadata;

        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: "/coupons/create",
          apiKey: p.apiKey,
          method: "POST",
          body: JSON.stringify(body),
        });
        const d = res.data;
        return {
          content: [{ type: "text", text: `Cupom: ${d.id} — ${d.discountKind} ${d.discount} — ${d.status}` }],
        };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2ListCoupons",
    "Lista cupons (API v2).",
    {
      apiKey: v2ApiKey,
      after: z.string().optional(),
      before: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      id: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/coupons/list${buildQuery({
            after: p.after,
            before: p.before,
            limit: p.limit,
            id: p.id,
            status: p.status,
          })}`,
          apiKey: p.apiKey,
          method: "GET",
        });
        const rows =
          res.data?.map((c: any, i: number) => `${i + 1}. ${c.id} — ${c.discountKind} — ${c.status}`).join("\n") ||
          "Nenhum cupom.";
        return { content: [{ type: "text", text: `${rows}${paginationHint(res.pagination)}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2GetCoupon",
    "Busca cupom (API v2).",
    {
      apiKey: v2ApiKey,
      id: z.string().optional(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/coupons/get${buildQuery({ id: p.id })}`,
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
    "v2DeleteCoupon",
    "Remove cupom (API v2).",
    {
      apiKey: v2ApiKey,
      id: z.string(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/coupons/delete${buildQuery({ id: p.id })}`,
          apiKey: p.apiKey,
          method: "POST",
          body: "{}",
        });
        return { content: [{ type: "text", text: `Cupom removido: ${res.data?.id ?? p.id}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.tool(
    "v2ToggleCoupon",
    "Alterna cupom ativo/inativo (API v2).",
    {
      apiKey: v2ApiKey,
      id: z.string(),
    },
    async (params) => {
      const p = params as any;
      try {
        const res = await makeAbacatePayRequest<any>({
          version: "v2",
          path: `/coupons/toggle${buildQuery({ id: p.id })}`,
          apiKey: p.apiKey,
          method: "POST",
          body: "{}",
        });
        return { content: [{ type: "text", text: `Status: ${res.data?.status}` }] };
      } catch (e) {
        return toolError(e);
      }
    }
  );
}

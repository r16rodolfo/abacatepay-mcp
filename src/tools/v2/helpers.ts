import { z } from "zod";

export const v2ApiKey = z
  .string()
  .optional()
  .describe(
    "Chave de API AbacatePay **v2** (opcional se ABACATE_PAY_API_KEY for uma chave v2)."
  );

export type V2Pagination = {
  hasMore?: boolean;
  next?: string | null;
  before?: string | null;
};

export function paginationHint(pagination: V2Pagination | undefined): string {
  if (!pagination) return "";
  const parts: string[] = [];
  if (pagination.hasMore && pagination.next) {
    parts.push(`Próxima página: use after="${pagination.next}".`);
  }
  if (pagination.before) {
    parts.push(`Anterior: before="${pagination.before}".`);
  }
  return parts.length ? `\n\n📄 **Paginação:** ${parts.join(" ")}` : "";
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function toolError(e: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text: e instanceof Error ? e.message : "Erro desconhecido",
      },
    ],
  };
}

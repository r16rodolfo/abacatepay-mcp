import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../http/api.js";

const pixKeySchema = z
  .object({
    type: z.enum(["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM", "BR_CODE"]),
    key: z.string(),
  })
  .strict();

export function registerWithdrawTools(server: McpServer) {
  server.tool(
    "createWithdraw",
    "Cria um saque para transferir valores da conta para uma chave PIX (API v1 — requer chave v1).",
    {
      apiKey: z
        .string()
        .optional()
        .describe("Chave de API v1 (opcional se ABACATE_PAY_API_KEY configurada)"),
      description: z.string().optional().describe("Descrição opcional do saque"),
      externalId: z.string().describe("ID externo único do saque no seu sistema"),
      method: z.literal("PIX").describe("Método de saque (apenas PIX na API v1)"),
      amount: z.number().describe("Valor do saque em centavos (mín. 350)"),
      pix: pixKeySchema.describe("Chave PIX de destino"),
    },
    async (params) => {
      const { apiKey, description, externalId, method, amount, pix } = params as any;
      try {
        const requestBody: Record<string, unknown> = {
          externalId,
          method,
          amount,
          pix,
        };
        if (description) {
          requestBody.description = description;
        }

        const response = await makeAbacatePayRequest<any>({
          version: "v1",
          path: "/withdraw/create",
          apiKey,
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        const data = response.data;
        const amountFormatted = (data.amount / 100).toFixed(2);
        const feeFormatted = (data.platformFee / 100).toFixed(2);

        return {
          content: [
            {
              type: "text",
              text:
                `💰 **Saque criado com sucesso!**\n\n` +
                `📋 **Detalhes:**\n` +
                `• ID: ${data.id}\n` +
                `• Status: ${data.status}\n` +
                `• Valor: R$ ${amountFormatted}\n` +
                `• Taxa da Plataforma: R$ ${feeFormatted}\n` +
                `• ID Externo: ${data.externalId}\n` +
                `• Tipo: ${data.kind}\n` +
                `• Criado em: ${new Date(data.createdAt).toLocaleString("pt-BR")}\n` +
                `• Atualizado em: ${new Date(data.updatedAt).toLocaleString("pt-BR")}\n\n` +
                `📄 **Comprovante:** ${data.receiptUrl}\n\n` +
                `${data.devMode ? "⚠️ Modo de desenvolvimento ativo" : "✅ Modo de produção"}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Falha ao criar saque: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "listWithdraw",
    "Lista todos os saques criados (API v1 — requer chave v1).",
    {
      apiKey: z
        .string()
        .optional()
        .describe("Chave de API v1 (opcional se ABACATE_PAY_API_KEY configurada)"),
    },
    async (params) => {
      const { apiKey } = params as any;
      try {
        const response = await makeAbacatePayRequest<any>({
          version: "v1",
          path: "/withdraw/list",
          apiKey,
          method: "GET",
        });

        if (!response.data?.length) {
          return {
            content: [{ type: "text", text: "Nenhum saque encontrado." }],
          };
        }

        const lines = response.data.map((t: any, i: number) => {
          const amt = (t.amount / 100).toFixed(2);
          return `${i + 1}. ${t.status} — R$ ${amt} — ext: ${t.externalId} — ${t.id}`;
        });

        return {
          content: [
            {
              type: "text",
              text: `**Saques** (${response.data.length}):\n\n${lines.join("\n")}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Falha ao listar saques: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "getWithdraw",
    "Busca um saque pelo externalId (API v1 — requer chave v1).",
    {
      apiKey: z
        .string()
        .optional()
        .describe("Chave de API v1 (opcional se ABACATE_PAY_API_KEY configurada)"),
      externalId: z.string().describe("Identificador externo do saque no seu sistema"),
    },
    async (params) => {
      const { apiKey, externalId } = params as any;
      try {
        const response = await makeAbacatePayRequest<any>({
          version: "v1",
          path: `/withdraw/get?externalId=${encodeURIComponent(externalId)}`,
          apiKey,
          method: "GET",
        });

        const data = response.data;
        const amountFormatted = (data.amount / 100).toFixed(2);

        return {
          content: [
            {
              type: "text",
              text:
                `**Saque** ${data.id}\n` +
                `Status: ${data.status}\n` +
                `Valor: R$ ${amountFormatted}\n` +
                `External ID: ${data.externalId}\n` +
                `Comprovante: ${data.receiptUrl}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Falha ao buscar saque: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            },
          ],
        };
      }
    }
  );
}

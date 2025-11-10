import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../http/api.js";
import { resolveApiKey } from "../utils/api-key.js";
import { formatHttpError } from "../utils/errors.js";

export function registerWithdrawTools(server: McpServer) {
  server.tool(
    "createWithdraw",
    "Cria um novo saque para transferir valores da conta para uma chave PIX",
    {
      description: z.string().describe("Descrição do saque"),
      externalId: z.string().describe("ID externo para identificação do saque"),
      method: z.string().describe("Método de pagamento (ex: PIX)"),
      amount: z.number().describe("Valor do saque em centavos"),
      pix: z.object({
        type: z.string().describe("Tipo da chave PIX (ex: CPF, CNPJ, EMAIL, PHONE, RANDOM)"),
        key: z.string().describe("Chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)")
      }).describe("Dados da chave PIX para o saque")
    },
    async (params) => {
      const { description, externalId, method, amount, pix } = params as any;
      
      const finalApiKey = resolveApiKey();
      if (!finalApiKey) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Erro: API key é obrigatória. Configure via header HTTP ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY."
            }
          ]
        };
      }
      
      const requestBody = {
        description,
        externalId,
        method,
        amount,
        pix
      };

      const result = await makeAbacatePayRequest<any>("/withdraw/create", finalApiKey, {
        method: "POST",
        body: JSON.stringify(requestBody)
      });

      if (result.error) {
        const errorMessage = formatHttpError(result.error);
        
        return {
          content: [
            {
              type: "text",
              text: `Falha ao criar saque: ${errorMessage}`
            }
          ]
        };
      }

      const data = result.data?.data;
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "Erro: Resposta inválida da API"
            }
          ]
        };
      }

      const amountFormatted = (data.amount / 100).toFixed(2);
      const feeFormatted = (data.platformFee / 100).toFixed(2);
      
      return {
        content: [
          {
            type: "text",
            text: `💰 **Saque criado com sucesso!**\n\n` +
                  `📋 **Detalhes:**\n` +
                  `• ID: ${data.id}\n` +
                  `• Status: ${data.status}\n` +
                  `• Valor: R$ ${amountFormatted}\n` +
                  `• Taxa da Plataforma: R$ ${feeFormatted}\n` +
                  `• ID Externo: ${data.externalId}\n` +
                  `• Tipo: ${data.kind}\n` +
                  `• Criado em: ${new Date(data.createdAt).toLocaleString('pt-BR')}\n` +
                  `• Atualizado em: ${new Date(data.updatedAt).toLocaleString('pt-BR')}\n\n` +
                  `📄 **Comprovante:** ${data.receiptUrl}\n\n` +
                  `${data.devMode ? '⚠️ Modo de desenvolvimento ativo' : '✅ Modo de produção'}`
          }
        ]
      };
    }
  );
}

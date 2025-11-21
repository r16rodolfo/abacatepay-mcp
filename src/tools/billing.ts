import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../http/api.js";
import { resolveApiKey } from "../utils/api-key.js";
import { formatHttpError } from "../utils/errors.js";

export function registerBillingTools(server: McpServer) {
  server.tool(
    "createBilling",
    "Cria uma nova cobrança no Abacate Pay",
    {
      frequency: z.enum(["ONE_TIME", "MULTIPLE_PAYMENTS"]).default("ONE_TIME").describe("Tipo de frequência da cobrança"),
      methods: z.array(z.enum(["PIX"])).default(["PIX"]).describe("Métodos de pagamento (atualmente apenas PIX)"),
      products: z.array(z.object({
        externalId: z.string().describe("ID externo do produto"),
        name: z.string().describe("Nome do produto"),
        description: z.string().describe("Descrição do produto"),
        quantity: z.number().describe("Quantidade do produto"),
        price: z.number().describe("Preço unitário em centavos")
      })).describe("Lista de produtos"),
      returnUrl: z.string().url().describe("URL para redirecionar caso o cliente clique em 'Voltar'"),
      completionUrl: z.string().url().describe("URL para redirecionar quando o pagamento for concluído"),
      customerId: z.string().optional().describe("ID de um cliente já cadastrado (opcional)")
    },
    async (params) => {
      const { frequency, methods, products, returnUrl, completionUrl, customerId } = params as any;
      
      const finalApiKey = resolveApiKey(server.sessionId as string);
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
      
      const requestBody: any = {
        frequency,
        methods,
        products,
        returnUrl,
        completionUrl
      };

      if (customerId) {
        requestBody.customerId = customerId;
      }

      const result = await makeAbacatePayRequest<any>("/billing/create", finalApiKey, {
        method: "POST",
        body: JSON.stringify(requestBody)
      });

      if (result.error) {
        const errorMessage = formatHttpError(result.error);
        
        return {
          content: [
            {
              type: "text",
              text: `Falha ao criar cobrança: ${errorMessage}`
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

      const totalAmount = (data.amount / 100).toFixed(2);
      
      return {
        content: [
          {
            type: "text",
            text: `Cobrança criada com sucesso! 🎉\n\n` +
                  `📋 **Detalhes da Cobrança:**\n` +
                  `• ID: ${data.id}\n` +
                  `• Status: ${data.status}\n` +
                  `• Valor Total: R$ ${totalAmount}\n` +
                  `• Frequência: ${data.frequency}\n` +
                  `• Métodos: ${data.methods.join(', ')}\n` +
                  `• Produtos: ${data.products.length} item(s)\n\n` +
                  `🔗 **Link de Pagamento:**\n${data.url}\n\n` +
                  `${data.devMode ? '⚠️ Modo de desenvolvimento ativo' : '✅ Modo de produção'}`
          }
        ]
      };
    }
  );

  server.tool(
    "listBillings",
    "Lista todas as cobranças criadas no Abacate Pay",
    {
    },
    async () => {
      const finalApiKey = resolveApiKey(server.sessionId as string);
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
      
      const result = await makeAbacatePayRequest<any>("/billing/list", finalApiKey, {
        method: "GET"
      });

      if (result.error) {
        const errorMessage = formatHttpError(result.error);
        
        return {
          content: [
            {
              type: "text",
              text: `Falha ao listar cobranças: ${errorMessage}`
            }
          ]
        };
      }

      if (!result.data?.data || result.data.data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Nenhuma cobrança encontrada."
            }
          ]
        };
      }

      const billingsList = result.data.data.map((billing: any, index: number) => {
        const amount = (billing.amount / 100).toFixed(2);
        const customer = billing.customer?.metadata;
        
        const statusEmojis: Record<string, string> = {
          'PENDING': '⏳',
          'PAID': '✅',
          'EXPIRED': '⏰',
          'CANCELLED': '❌',
          'REFUNDED': '↩️'
        };
        const statusEmoji = statusEmojis[billing.status] || '❓';

        return `${index + 1}. ${statusEmoji} **${billing.status}** - R$ ${amount}
     📋 ID: ${billing.id}
     🔗 URL: ${billing.url}
     📦 Produtos: ${billing.products.length} item(s)
     👤 Cliente: ${customer?.name || 'N/A'}
     📅 Frequência: ${billing.frequency}
     💳 Métodos: ${billing.methods.join(', ')}
     ${billing.devMode ? '⚠️ Modo Dev' : '✅ Produção'}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: `📋 **Lista de Cobranças** (${result.data.data.length} encontrada(s)):\n\n${billingsList}`
          }
        ]
      };
    }
  );
} 
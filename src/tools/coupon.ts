import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../http/api.js";
import { resolveApiKey } from "../utils/api-key.js";
import { formatHttpError } from "../utils/errors.js";

export function registerCouponTools(server: McpServer) {
  server.tool(
    "createCoupon",
    "Cria um novo cupom de desconto",
    {
      code: z.string().describe("Código único do cupom (ex: DESCONTO20)"),
      discountKind: z.enum(["PERCENTAGE", "FIXED"]).describe("Tipo de desconto: PERCENTAGE (porcentagem) ou FIXED (valor fixo)"),
      discount: z.number().describe("Valor do desconto (em % para PERCENTAGE ou em centavos para FIXED)"),
      notes: z.string().optional().describe("Descrição sobre o cupom"),
      maxRedeems: z.number().default(-1).describe("Quantidade máxima de usos (-1 para ilimitado)"),
      metadata: z.object({}).optional().describe("Metadados adicionais do cupom")
    },
    async (params) => {
      const { code, discountKind, discount, notes, maxRedeems, metadata } = params as any;
      
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
      
      const requestBody: any = {
        code,
        discountKind,
        discount,
        maxRedeems
      };

      // Adicionar campos opcionais apenas se fornecidos
      if (notes) {
        requestBody.notes = notes;
      }

      if (metadata) {
        requestBody.metadata = metadata;
      }

      const result = await makeAbacatePayRequest<any>("/coupon/create", finalApiKey, {
        method: "POST",
        body: JSON.stringify(requestBody)
      });

      if (result.error) {
        const errorMessage = formatHttpError(result.error);
        
        return {
          content: [
            {
              type: "text",
              text: `Falha ao criar cupom: ${errorMessage}`
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
      
      const discountText = data.discountKind === 'PERCENTAGE' 
        ? `${data.discount}%` 
        : `R$ ${(data.discount / 100).toFixed(2)}`;
      
      const maxRedeemsText = data.maxRedeems === -1 
        ? 'Ilimitado' 
        : `${data.maxRedeems} vezes`;

      return {
        content: [
          {
            type: "text",
            text: `🎫 **Cupom criado com sucesso!**\n\n` +
                  `📋 **Detalhes do Cupom:**\n` +
                  `• Código: **${data.code}**\n` +
                  `• Desconto: ${discountText} (${data.discountKind === 'PERCENTAGE' ? 'Porcentagem' : 'Valor Fixo'})\n` +
                  `• Usos Máximos: ${maxRedeemsText}\n` +
                  `• Descrição: ${data.notes || 'Sem descrição'}\n\n` +
                  `✅ O cupom **${data.code}** está pronto para ser usado pelos seus clientes!`
          }
        ]
      };
    }
  );

  server.tool(
    "listCoupons",
    "Lista todos os cupons de desconto criados no Abacate Pay",
    {
    },
    async () => {
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
      
      const result = await makeAbacatePayRequest<any>("/coupon/list", finalApiKey, {
        method: "GET"
      });

      if (result.error) {
        const errorMessage = formatHttpError(result.error);
        
        return {
          content: [
            {
              type: "text",
              text: `Falha ao listar cupons: ${errorMessage}`
            }
          ]
        };
      }

      if (!result.data?.data || result.data.data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Nenhum cupom encontrado."
            }
          ]
        };
      }

      const couponsList = result.data.data.map((coupon: any, index: number) => {
        const discountText = coupon.discountKind === 'PERCENTAGE' 
          ? `${coupon.discount}%` 
          : `R$ ${(coupon.discount / 100).toFixed(2)}`;
        
        const maxRedeemsText = coupon.maxRedeems === -1 
          ? 'Ilimitado' 
          : `${coupon.maxRedeems} vezes`;

        return `${index + 1}. 🎫 **${coupon.code}**
     💰 Desconto: ${discountText} (${coupon.discountKind === 'PERCENTAGE' ? 'Porcentagem' : 'Valor Fixo'})
     🔄 Usos: ${maxRedeemsText}
     📝 Descrição: ${coupon.notes || 'Sem descrição'}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: `🎫 **Lista de Cupons** (${result.data.data.length} encontrado(s)):\n\n${couponsList}`
          }
        ]
      };
    }
  );
} 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeAbacatePayRequest } from "../http/api.js";
import { resolveApiKey } from "../utils/api-key.js";
import { formatHttpError } from "../utils/errors.js";
import { normalizeTaxId, normalizeCellphone, formatCPF, formatCellphone } from "../utils/formatters.js";

export function registerCustomerTools(server: McpServer) {
  server.tool(
    "createCustomer",
    "Cria um novo cliente no Abacate Pay",
    {
      apiKey: z.string().optional().describe("Chave de API do Abacate Pay (opcional se configurada globalmente)"),
      name: z.string().describe("Nome completo do cliente"),
      cellphone: z.string().describe("Celular do cliente (ex: (11) 4002-8922 ou 79991251557)"),
      email: z.string().email().describe("E-mail do cliente"),
      taxId: z.string().describe("CPF ou CNPJ válido do cliente (ex: 123.456.789-01 ou 03171207516)")
    },
    async (params) => {
      const { apiKey, name, cellphone, email, taxId } = params as any;
      
      // Resolve API key usando helper centralizado
      const finalApiKey = resolveApiKey(apiKey);
      if (!finalApiKey) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Erro: API key é obrigatória. Forneça via parâmetro apiKey, configure via header HTTP, ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY."
            }
          ]
        };
      }
      
      try {
        // Normaliza e formata os dados
        const normalizedTaxId = normalizeTaxId(taxId);
        const normalizedCellphone = normalizeCellphone(cellphone);
        
        // Prepara o corpo da requisição
        const requestBody = {
          name: name.trim(),
          cellphone: normalizedCellphone,
          email: email.trim().toLowerCase(),
          taxId: normalizedTaxId
        };
        
        const response = await makeAbacatePayRequest<any>("/customer/create", finalApiKey, {
          method: "POST",
          body: JSON.stringify(requestBody)
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ Cliente criado com sucesso!\n\n` +
                    `📋 Detalhes:\n` +
                    `• ID: ${response.data?.id || 'N/A'}\n` +
                    `• Nome: ${name}\n` +
                    `• Email: ${email}\n` +
                    `• Celular: ${formatCellphone(cellphone)}\n` +
                    `• CPF/CNPJ: ${normalizedTaxId.length === 11 ? formatCPF(normalizedTaxId) : normalizedTaxId}`
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? formatHttpError(error, {
              name,
              cellphone: normalizeCellphone(cellphone),
              email,
              taxId: normalizeTaxId(taxId)
            })
          : 'Erro desconhecido';
        
        return {
          content: [
            {
              type: "text",
              text: `❌ Falha ao criar cliente: ${errorMessage}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    "listCustomers",
    "Lista todos os clientes cadastrados no Abacate Pay",
    {
      apiKey: z.string().optional().describe("Chave de API do Abacate Pay (opcional se configurada globalmente)")
    },
    async (params) => {
      const { apiKey } = params as any;
      
      // Resolve API key usando helper centralizado
      const finalApiKey = resolveApiKey(apiKey);
      if (!finalApiKey) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Erro: API key é obrigatória. Forneça via parâmetro apiKey, configure via header HTTP, ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY."
            }
          ]
        };
      }
      
      try {
        const response = await makeAbacatePayRequest<any>("/customer/list", finalApiKey, {
          method: "GET"
        });

        if (!response.data || response.data.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Nenhum cliente encontrado."
              }
            ]
          };
        }

        const customersList = response.data.map((customer: any, index: number) => {
          const metadata = customer.metadata || {};
          return `${index + 1}. ID: ${customer.id}
     Nome: ${metadata.name || 'N/A'}
     Email: ${metadata.email || 'N/A'}
     Celular: ${metadata.cellphone || 'N/A'}
     CPF/CNPJ: ${metadata.taxId || 'N/A'}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: "text",
              text: `Lista de Clientes (${response.data.length} encontrado(s)):\n\n${customersList}`
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? formatHttpError(error)
          : 'Erro desconhecido';
        
        return {
          content: [
            {
              type: "text",
              text: `Falha ao listar clientes: ${errorMessage}`
            }
          ]
        };
      }
    }
  );
} 
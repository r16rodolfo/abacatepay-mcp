# 🥑 Abacate Pay MCP Server

Um servidor MCP (Model Context Protocol) para integração com a API do Abacate Pay, permitindo gerenciar pagamentos, clientes e cobranças diretamente através de assistentes de IA como Claude e Cursor.

## ✨ Multi-Tenancy

**🔐 Multi-tenancy ativo!** O servidor suporta múltiplos clientes simultaneamente. No modo HTTP, cada requisição pode incluir sua própria chave de API via header `Authorization` ou `X-API-Key`, permitindo que diferentes usuários/organizações usem o mesmo servidor MCP com suas respectivas contas do Abacate Pay.

## O que você pode fazer

- 👥 **Gerenciar clientes**: Criar e listar clientes
- 💰 **Criar cobranças**: Links de pagamento e faturas  
- 📱 **QR Codes PIX**: Pagamentos instantâneos
- 🎫 **Cupons de desconto**: Promoções e descontos
- 🔄 **Simular pagamentos**: Testar fluxos em desenvolvimento

## 🚀 Instalação e Configuração

> **💡 Dica**: Se você só precisa usar o servidor MCP via HTTP (AgentKit, n8n, etc.), não precisa instalar localmente! Use o servidor público em `https://mcp.abacatepay.com/mcp` - veja a seção [Uso Remoto e Automação](#-uso-remoto-e-automação).

### 1. Clone o repositório

```bash
git clone https://github.com/AbacatePay/abacatepay-mcp.git
cd abacatepay-mcp
bun install
```

**📋 Pré-requisitos:**
- [Bun](https://bun.sh) instalado (versão 1.0.0 ou superior)

### 2. Configure no Claude Desktop

```json
{
  "mcpServers": {
    "abacate-pay": {
      "command": "bun",
      "args": ["/caminho/completo/para/abacatepay-mcp/src/index.ts"],
      "env": {
        "ABACATE_PAY_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

### 3. Configure no Cursor

```json
{
  "mcp.servers": {
    "abacate-pay": {
      "command": "bun",
      "args": ["/caminho/completo/para/abacatepay-mcp/src/index.ts"],
      "env": {
        "ABACATE_PAY_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

**⚠️ Importante**: 
- Substitua `/caminho/completo/para/abacatepay-mcp/` pelo caminho real onde você clonou o repositório
- No modo stdio (Cursor/Claude Desktop), a API key deve ser configurada via variável de ambiente `env` na configuração do cliente

## 🔑 Como obter sua API Key

1. Acesse [Abacate Pay](https://www.abacatepay.com)
2. Vá em **Integrar** → **API Keys**
3. Copie sua API Key

## 📝 Exemplos de Uso

### 🎯 Campanha com Influencer
```
"Eu contratei um influencer chamado Alex para divulgar meu negócio. Você pode criar um cupom com 15% de desconto usando o código ALEX15 que vale para até 100 usos? Preciso acompanhar o desempenho da campanha."
```

### 🔍 Investigação de Cobranças
```
"Tive uma cobrança estranha ontem que não reconheço. Você pode buscar todas as cobranças de ontem e me mostrar os detalhes para eu verificar o que pode ter acontecido?"
```

### 💼 Novo Cliente Corporativo  
```
"Acabei de fechar um contrato com a empresa TechSolutions LTDA (CNPJ: 12.345.678/0001-90). Pode criar o cadastro deles com o email contato@techsolutions.com e telefone (11) 3456-7890? Depois preciso gerar um QR Code PIX de R$ 10 para o pagamento."
```

## 🔐 Como Funciona

O servidor MCP funciona de duas formas diferentes dependendo de como você vai usá-lo:

### 📱 Modo stdio (Cursor, Claude Desktop)

No modo stdio, o servidor se comunica via entrada/saída padrão. A API key deve ser configurada via variável de ambiente na configuração do cliente.

**Exemplo de uso:**
```
"Crie um cliente chamado João Silva, com email joao@exemplo.com, 
celular (11) 99999-9999 e CPF 123.456.789-01"
```

A API key é obtida automaticamente da variável de ambiente `ABACATE_PAY_API_KEY` configurada no cliente.

### 🌐 Modo HTTP (AgentKit, n8n, automações)

No modo HTTP, o servidor aceita requisições HTTP e suporta multi-tenancy através de headers HTTP.

**Autenticação via Header:**

A API key pode ser fornecida de duas formas:

1. **Via Header `Authorization` (Recomendado):**
```bash
Authorization: Bearer sua_api_key_aqui
```

2. **Via Header `X-API-Key`:**
```bash
X-API-Key: sua_api_key_aqui
```

**⚠️ Importante**: No modo HTTP, se você passar a API key no header, não precisa passá-la como parâmetro da ferramenta. O servidor automaticamente usa a chave do header.

### Vantagens

✅ **Múltiplos usuários**: Diferentes pessoas podem usar o mesmo servidor MCP  
✅ **Isolamento de dados**: Cada API key acessa apenas seus próprios dados  
✅ **Flexibilidade**: Modo stdio para uso local, modo HTTP para automações  
✅ **Segurança**: Credenciais via headers HTTP ou variáveis de ambiente  
✅ **Escalabilidade**: Fácil de compartilhar entre equipes  
✅ **Multi-tenancy**: Suporte a múltiplos clientes simultâneos no modo HTTP  

## 🌐 Uso Remoto e Automação

### 🚀 Servidor Público Disponível

**✨ Servidor MCP já deployado e disponível!**

Você pode usar o servidor MCP da Abacate Pay diretamente sem precisar instalar localmente:

**Endpoint:** `https://mcp.abacatepay.com/mcp`

Basta configurar sua API key no header `Authorization` ou `X-API-Key` e começar a usar!

### HTTP Server para Automação

Para usar com ferramentas como n8n, Zapier, ou aplicações customizadas, você pode:

**Opção 1: Usar o servidor público (Recomendado)**
- Endpoint: `https://mcp.abacatepay.com/mcp`
- Sem necessidade de instalação ou configuração

**Opção 2: Rodar localmente**
```bash
# Start HTTP server
bun run start:http

# Ou com porta customizada
MCP_PORT=8080 bun run start:http
```

### Exemplo de Integração

**HTTP Request (n8n/Zapier) - Usando servidor público:**
```bash
POST https://mcp.abacatepay.com/mcp
Headers:
  Authorization: Bearer sua_api_key_aqui
  Content-Type: application/json

Body:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "createPixQrCode",
    "arguments": {
      "amount": 1000,
      "description": "Pagamento via automação"
    }
  }
}
```

**JavaScript/Node.js:**
```javascript
async function createCustomer(customerData) {
  const response = await fetch('https://mcp.abacatepay.com/mcp', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sua_api_key_aqui',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'createCustomer',
        arguments: customerData
      }
    })
  });
  return response.json();
}
```

## 🐛 Problemas Comuns

### Erro de API Key
```
❌ Erro: API key é obrigatória. Configure via header HTTP ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY.
```
**Solução**: 
- **Modo stdio (Cursor/Claude Desktop)**: Verifique se a API key está configurada corretamente na variável de ambiente `env` do arquivo de configuração
- **Modo HTTP**: Verifique se a API key está sendo enviada no header `Authorization: Bearer <key>` ou `X-API-Key: <key>`

### MCP Server não conecta
**Solução**: 
1. Verifique se o caminho para o arquivo está correto
2. Reinicie o Claude Desktop/Cursor após adicionar a configuração
3. Certifique-se de que o Bun está instalado e funcionando

### Erro de permissão
**Solução**: Certifique-se de que o Bun está instalado corretamente:
```bash
# Verificar instalação do Bun
bun --version

# Se necessário, instalar o Bun
curl -fsSL https://bun.sh/install | bash
```

## 🤝 Contribuição

Quer contribuir? Veja o [Guia de Contribuição](CONTRIBUTING.md).

## 📄 Licença

MIT - veja [LICENSE](LICENSE) para detalhes.

---




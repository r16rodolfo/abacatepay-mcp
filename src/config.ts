import minimist from "minimist";

const argv = minimist(process.argv.slice(2));

// API key can be provided globally (legacy mode) or per request (multi-tenant mode)
export const apiKey = argv.key || process.env.ABACATE_PAY_API_KEY;

export function validateApiKey(): string {
  return apiKey || '';
}

// Só valida se estamos executando como script principal
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('index.js') || 
  process.argv[1].endsWith('dist/index.js') ||
  process.argv[1].includes('abacatepay-mcp')
);

// Só mostra mensagem para stdio, não para HTTP (que tem seu próprio banner)
const isStdioServer = isMainModule && process.argv[1]?.includes('index.ts');

if (isStdioServer && !process.env.NODE_ENV?.includes('test')) {
  console.log("🥑 Abacate Pay MCP Server rodando em stdio");
}

export const ABACATE_PAY_API_BASE = "https://api.abacatepay.com/v1";
export const USER_AGENT = "abacatepay-mcp/1.0"; 
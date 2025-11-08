import "./config.js"; 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "abacatepay-mcp",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  registerAllTools(server);

  return server;
}

async function main() {
  try {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("🥑 Abacate Pay MCP Server rodando em stdio");
  } catch (error) {
    console.error("❌ Erro fatal em main():", error);
    process.exit(1);
  }
}

main();

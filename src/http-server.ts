import "./config.js";
import express from "express";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { registerAllTools } from "./tools/index.js";
import { setSessionApiKey, setCurrentSessionId, clearSessionContext } from "./context.js";
import { validateApiKeyMiddleware } from "./http/middleware.js";

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
  const app = express();
  app.use((express as any).json({ limit: '10mb' }));

  // Aplica o middleware de autenticação em todas as rotas /mcp
  app.use('/mcp', validateApiKeyMiddleware);

  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req: Request, res: Response) => {
    console.log(`[HTTP-SERVER] POST /mcp recebido`);
    console.log(`[HTTP-SERVER] Body:`, JSON.stringify(req.body, null, 2));
    console.log(`[HTTP-SERVER] Method do body:`, req.body?.method);
    
    // Armazena a API key validada no contexto da sessão
    const validatedApiKey = (req as any).validatedApiKey;
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    console.log(`[HTTP-SERVER] Session ID:`, sessionId || 'não fornecido');
    console.log(`[HTTP-SERVER] Validated API Key:`, validatedApiKey ? `${validatedApiKey.substring(0, 10)}...` : 'não encontrada');
    
    // Armazena a API key no contexto da sessão
    if (validatedApiKey) {
      setSessionApiKey(sessionId, validatedApiKey);
      setCurrentSessionId(sessionId);
      console.log(`[HTTP-SERVER] API key armazenada no contexto da sessão`);
    }
    
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      console.log(`[HTTP-SERVER] Reutilizando transporte existente para sessão: ${sessionId}`);
      // Reuse existing transport
      transport = transports[sessionId];
      // Atualiza a API key no contexto quando reutiliza transporte
      if (validatedApiKey) {
        setSessionApiKey(sessionId, validatedApiKey);
        setCurrentSessionId(sessionId);
      }
    } else if (!sessionId && isInitializeRequest((req as any).body)) {
      console.log(`[HTTP-SERVER] Nova requisição de inicialização detectada`);
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (initializedSessionId) => {
          console.log(`[HTTP-SERVER] Sessão inicializada: ${initializedSessionId}`);
          // Store the transport by session ID
          transports[initializedSessionId] = transport;
          // Armazena a API key quando a sessão é inicializada
          if (validatedApiKey) {
            setSessionApiKey(initializedSessionId, validatedApiKey);
            setCurrentSessionId(initializedSessionId);
            console.log(`[HTTP-SERVER] API key armazenada na sessão inicializada`);
          }
        },
        // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
        // locally, make sure to set:
        // enableDnsRebindingProtection: true,
        // allowedHosts: ['127.0.0.1'],
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          console.log(`[HTTP-SERVER] Transporte fechado para sessão: ${transport.sessionId}`);
          delete transports[transport.sessionId];
          clearSessionContext(transport.sessionId);
        }
      };

      const server = createServer();

      // Connect to the MCP server
      await server.connect(transport);
      console.log(`[HTTP-SERVER] Servidor MCP conectado ao transporte`);
    } else {
      console.log(`[HTTP-SERVER] ❌ Requisição inválida - sem session ID válido`);
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Define o contexto antes de processar a requisição
    // Isso garante que as ferramentas possam acessar a API key
    if (validatedApiKey && transport.sessionId) {
      setSessionApiKey(transport.sessionId, validatedApiKey);
      setCurrentSessionId(transport.sessionId);
      console.log(`[HTTP-SERVER] Contexto definido para sessão: ${transport.sessionId}`);
    }
    
    console.log(`[HTTP-SERVER] Processando requisição MCP...`);
    // Handle the request
    await transport.handleRequest(req, res, (req as any).body);
  });

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (req: Request, res: Response) => {
    console.log(`[HTTP-SERVER] ${req.method} /mcp recebido`);
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    console.log(`[HTTP-SERVER] Session ID:`, sessionId || 'não fornecido');
    
    if (!sessionId || !transports[sessionId]) {
      console.log(`[HTTP-SERVER] ❌ Session ID inválido ou transporte não encontrado`);
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    console.log(`[HTTP-SERVER] ✅ Transporte encontrado para sessão: ${sessionId}`);
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  };

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', handleSessionRequest);

  // Handle DELETE requests for session termination
  app.delete('/mcp', handleSessionRequest);

  // Get port from environment or use default
  const port = parseInt(process.env.MCP_PORT || process.env.PORT || "3000");

  app.listen(port, () => {
    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║     🥑 Abacate Pay MCP Server - HTTP Mode             ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`  🚀 Servidor:     http://localhost:${port}`);
    console.log(`  📡 Endpoint:     http://localhost:${port}/mcp`);
    console.log(`  📖 Documentação: http://localhost:${port}/mcp/schema`);
    console.log("");
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor...');
    // Close all active transports
    for (const transport of Object.values(transports)) {
      await transport.close();
    }
    process.exit(0);
  });
}

main();


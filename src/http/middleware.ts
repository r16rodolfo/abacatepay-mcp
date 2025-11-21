import type { Request, Response, NextFunction } from "express";
import { apiKey } from "../config.js";
import { ScalekitClient, type TokenValidationOptions } from "@scalekit-sdk/node";
import { setSessionApiKey, setCurrentSessionId } from "../context.js";

interface RequestWithBody extends Request {
  body?: Record<string, unknown>;
}

export interface RequestWithApiKey extends Request {
  validatedApiKey?: string;
}

export interface RequestWithOAuth extends Request {
  oauthApiKey?: string;
  oauthUserId?: string;
}

/**
 * Middleware para validar API key nas requisições HTTP
 * Extrai a API key dos headers Authorization ou X-API-Key
 * e adiciona ao request como validatedApiKey
 */
export function validateApiKeyMiddleware(req: RequestWithApiKey, res: Response, next: NextFunction) {
  // Extrai a API key do header Authorization (Bearer token) ou X-API-Key
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
  
  let requestApiKey: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    requestApiKey = authHeader.substring(7);
  } else if (apiKeyHeader) {
    requestApiKey = apiKeyHeader;
  }
  
  // Se não há API key na requisição, usa a global
  const finalApiKey = requestApiKey || apiKey;
  
  // Valida se há pelo menos uma API key (global ou na requisição)
  if (!finalApiKey || finalApiKey.trim() === '') {
    res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: 'Unauthorized: API key é obrigatória. Forneça via header Authorization: Bearer <key> ou X-API-Key: <key>, ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY',
      },
      id: null,
    });
    return;
  }
  
  // Adiciona a API key validada ao request para uso posterior
  req.validatedApiKey = finalApiKey;
  next();
}

/**
 * Middleware para validar OAuth token usando Scalekit
 * Ignora rotas que começam com /.well-known/
 */
export async function validateOAuthMiddleware(
  req: RequestWithBody,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Se a rota começa com /.well-known/, deixa passar sem autenticação
  if (req.path.startsWith('/.well-known/')) {
    return next();
  }

  try {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).setHeader(
        'WWW-Authenticate',
        `Bearer realm="OAuth", resource_metadata="${process.env.SCALEKIT_RESOURCE_METADATA_URL || ''}"`
      ).json({
        error: 'unauthorized',
        error_description: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Obtém o body da requisição (já parseado pelo express.json())
    const requestData = req.body;

    // Inicializa o cliente Scalekit com as credenciais do ambiente
    const envUrl = process.env.URL_SCALE_KIT;
    const clientId = process.env.CLIENT_SCALE_KIT;
    const clientSecret = process.env.SECRET_SCALE_KIT;
    const audience = process.env.SCALEKIT_AUDIENCE_NAME;
    const resourceMetadataUrl = process.env.SCALEKIT_RESOURCE_METADATA_URL;

    if (!envUrl || !clientId || !clientSecret) {
      res.status(500).json({
        error: 'internal_error',
        error_description: 'Configuração Scalekit incompleta',
      });
      return;
    }

    const scalekitClient = new ScalekitClient(envUrl, clientId, clientSecret);

    // Verifica se é uma chamada de tool
    const isToolCall = requestData?.method === 'tools/call';

    // Configura opções de validação
    const validationOptions: TokenValidationOptions = {
      issuer: envUrl,
      audience: audience ? [audience] : undefined,
    };

    // Se for tool call, adiciona scope obrigatório
    if (isToolCall) {
      validationOptions.requiredScopes = ['search:read'];
    }

    // Valida o token e extrai o payload usando Scalekit
    try {
      // Usa validateToken para obter o payload do token
      const payload = await scalekitClient.validateToken<Record<string, unknown>>(token, validationOptions);
      
      // Extrai informações do usuário do payload do token
      // TODO: Implementar mapeamento OAuth -> API key do Abacate Pay
      const userId = payload.sub as string | undefined;
      // const email = payload.email as string | undefined; // Reservado para uso futuro
      
      // Por enquanto, usa API key global como fallback
      // TODO: Implementar busca da API key via API do Abacate Pay ou mapeamento
      const abacatePayApiKey = process.env.ABACATE_PAY_API_KEY;
      
      if (!abacatePayApiKey) {
        res.status(403).json({
          error: 'forbidden',
          error_description: 'API key do Abacate Pay não encontrada. Configure ABACATE_PAY_API_KEY ou implemente mapeamento OAuth.',
        });
        return;
      }

      // Armazena a API key no contexto da sessão
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      setSessionApiKey(sessionId, abacatePayApiKey);
      setCurrentSessionId(sessionId);

      // Adiciona informações ao request para uso posterior
      (req as RequestWithOAuth).oauthApiKey = abacatePayApiKey;
      (req as RequestWithOAuth).oauthUserId = userId;
      
    } catch (error) {
      res.status(401).setHeader(
        'WWW-Authenticate',
        `Bearer realm="OAuth", resource_metadata="${resourceMetadataUrl}"`
      ).json({
        error: 'unauthorized',
        error_description: error instanceof Error ? error.message : 'Token validation failed',
      });
      return;
    }

    // Token válido e API key mapeada, continua com a requisição
    next();
  } catch (error) {
    res.status(401).setHeader(
      'WWW-Authenticate',
      `Bearer realm="OAuth", resource_metadata="${process.env.SCALEKIT_RESOURCE_METADATA_URL || ''}"`
    ).json({
      error: 'unauthorized',
      error_description: error instanceof Error ? error.message : 'Authentication failed',
    });
    return;
  }
}

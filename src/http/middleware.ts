import type { Request, Response, NextFunction } from "express";
import { apiKey } from "../config.js";

/**
 * Middleware para validar API key nas requisições HTTP
 * Extrai a API key dos headers Authorization ou X-API-Key
 * e adiciona ao request como validatedApiKey
 */
export function validateApiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
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
  (req as any).validatedApiKey = finalApiKey;
  next();
}


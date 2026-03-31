import type { NextFunction, Request, Response } from "express";
import { apiKey as globalApiKey } from "../config.js";

export type RequestWithValidatedApiKey = Request & {
  validatedApiKey?: string;
};

/**
 * Extract API key from Authorization (Bearer) or X-API-Key, else global config.
 */
export function validateApiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const headerKey = req.headers["x-api-key"];
  const apiKeyHeader = typeof headerKey === "string" ? headerKey : undefined;

  let fromRequest: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    fromRequest = authHeader.slice(7);
  } else if (apiKeyHeader) {
    fromRequest = apiKeyHeader;
  }

  const finalKey = fromRequest?.trim() || globalApiKey?.trim() || "";

  if (!finalKey) {
    // Use 403 (not 401): MCP StreamableHTTP clients treat 401 as "start OAuth" and POST /register,
    // which this server does not implement. Abacate keys go in Authorization / X-API-Key.
    res.status(403).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message:
          "Forbidden: API key é obrigatória. No cliente remoto (ex.: Cursor), configure Authorization: Bearer <sua chave Abacate Pay> ou X-API-Key no MCP; no servidor use ABACATE_PAY_API_KEY / --key como fallback.",
      },
      id: null,
    });
    return;
  }

  (req as RequestWithValidatedApiKey).validatedApiKey = finalKey;
  next();
}

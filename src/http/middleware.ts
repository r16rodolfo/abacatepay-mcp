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
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message:
          "Unauthorized: API key é obrigatória. Forneça via header Authorization: Bearer <key> ou X-API-Key, ou configure ABACATE_PAY_API_KEY / --key.",
      },
      id: null,
    });
    return;
  }

  (req as RequestWithValidatedApiKey).validatedApiKey = finalKey;
  next();
}

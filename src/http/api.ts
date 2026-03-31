import {
  ABACATE_PAY_API_BASE_V1,
  ABACATE_PAY_API_BASE_V2,
  USER_AGENT,
} from "../config.js";
import { resolveApiKey } from "../utils/api-key.js";

export type ApiVersion = "v1" | "v2";

function getBaseUrl(version: ApiVersion): string {
  return version === "v1" ? ABACATE_PAY_API_BASE_V1 : ABACATE_PAY_API_BASE_V2;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildErrorMessage(status: number, bodyText: string): string {
  let detail = bodyText;
  try {
    const parsed = JSON.parse(bodyText) as { error?: string };
    if (parsed?.error && typeof parsed.error === "string") {
      detail = parsed.error;
    }
  } catch {
    // use raw body
  }
  let message = `HTTP ${status}: ${detail}`;
  if (/version mismatch|incompat/i.test(message)) {
    message +=
      "\n\nDica: chaves da API v1 só funcionam com ferramentas legadas (sem prefixo v2). " +
      "Chaves v2 só funcionam com ferramentas cujo nome começa com v2.";
  }
  return message;
}

export type MakeAbacatePayRequestOptions = {
  version: ApiVersion;
  path: string;
  apiKey?: string;
  /** MCP streamable session id (HTTP); stdio typically omits. */
  sessionId?: string;
} & Omit<RequestInit, "headers"> & {
    headers?: HeadersInit;
  };

export async function makeAbacatePayRequest<T = unknown>(
  options: MakeAbacatePayRequestOptions
): Promise<T> {
  const {
    version,
    path,
    apiKey: apiKeyOverride,
    sessionId,
    headers: userHeaders,
    ...fetchInit
  } = options;
  const url = `${getBaseUrl(version)}${normalizePath(path)}`;
  const authKey = resolveApiKey(sessionId, apiKeyOverride);
  if (!authKey) {
    throw new Error(
      "API key é obrigatória. No HTTP, use Authorization: Bearer ou X-API-Key; em stdio use ABACATE_PAY_API_KEY ou --key; opcionalmente passe apiKey na ferramenta."
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${authKey}`,
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
  };
  if (userHeaders && typeof userHeaders === "object" && !Array.isArray(userHeaders)) {
    Object.assign(headers, userHeaders as Record<string, string>);
  }

  const response = await fetch(url, {
    ...fetchInit,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(buildErrorMessage(response.status, errorText));
  }

  return response.json() as Promise<T>;
}

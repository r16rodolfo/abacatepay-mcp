import { validateApiKey } from "../config.js";
import { getSessionApiKey, getCurrentSessionId } from "../context.js";

/**
 * Resolve a API key na seguinte ordem de prioridade:
 * 1. API key fornecida como parâmetro
 * 2. API key do contexto da sessão (header HTTP)
 * 3. API key global (variável de ambiente)
 * 
 * @param apiKey - API key opcional fornecida como parâmetro
 * @returns API key resolvida ou null se não encontrada
 */
export function resolveApiKey(apiKey?: string): string | null {
  // 1. Prioridade: parâmetro fornecido
  if (apiKey && apiKey.trim() !== '') {
    return apiKey;
  }
  
  // 2. Prioridade: contexto da sessão
  const sessionId = getCurrentSessionId();
  const sessionApiKey = getSessionApiKey(sessionId);
  if (sessionApiKey && sessionApiKey.trim() !== '') {
    return sessionApiKey;
  }
  
  // 3. Prioridade: variável global
  const globalApiKey = validateApiKey();
  if (globalApiKey && globalApiKey.trim() !== '') {
    return globalApiKey;
  }
  
  return null;
}

/**
 * Valida e retorna a API key ou lança erro se não encontrada
 */
export function requireApiKey(apiKey?: string): string {
  const resolved = resolveApiKey(apiKey);
  if (!resolved) {
    throw new Error(
      "API key é obrigatória. Forneça via parâmetro apiKey, " +
      "configure via header HTTP (Authorization: Bearer <key> ou X-API-Key: <key>), " +
      "ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY"
    );
  }
  return resolved;
}


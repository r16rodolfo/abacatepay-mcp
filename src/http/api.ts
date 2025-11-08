import { ABACATE_PAY_API_BASE, USER_AGENT } from "../config.js";
import { resolveApiKey } from "../utils/api-key.js";

export async function makeAbacatePayRequest<T = any>(
  endpoint: string, 
  apiKey?: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ABACATE_PAY_API_BASE}${endpoint}`;
  
  // Resolve API key usando o helper centralizado
  const authKey = resolveApiKey(apiKey);
  if (!authKey) {
    throw new Error(
      "API key é obrigatória. Forneça via parâmetro apiKey, " +
      "configure via header HTTP, ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY"
    );
  }
  
  const headers = {
    'Authorization': `Bearer ${authKey}`,
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

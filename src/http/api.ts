import { ABACATE_PAY_API_BASE, USER_AGENT } from "../config.js";
import { resolveApiKey } from "../utils/api-key.js";

export async function makeAbacatePayRequest<T = any>(
  endpoint: string, 
  apiKey?: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: Error }> {
  const url = `${ABACATE_PAY_API_BASE}${endpoint}`;
  
  console.log(`[API] Fazendo requisição para: ${endpoint}`);
  console.log(`[API] API key fornecida como parâmetro:`, apiKey ? `${apiKey.substring(0, 10)}...` : 'não fornecida');
  
  // Resolve API key usando o helper centralizado
  const authKey = resolveApiKey(apiKey);
  if (!authKey) {
    console.log(`[API] ❌ API key não encontrada após resolução`);
    return {
      error: new Error(
        "API key é obrigatória. Forneça via parâmetro apiKey, " +
        "configure via header HTTP, ou configure globalmente via variável de ambiente ABACATE_PAY_API_KEY"
      )
    };
  }
  
  console.log(`[API] ✅ API key resolvida: ${authKey.substring(0, 10)}...`);
  
  const headers = {
    'Authorization': `Bearer ${authKey}`,
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
    ...options.headers,
  };

  console.log(`[API] Enviando requisição HTTP ${options.method || 'GET'} para ${url}`);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log(`[API] Resposta recebida: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[API] ❌ Erro HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    return {
      error: new Error(`HTTP ${response.status}: ${errorText}`)
    };
  }

  const data = await response.json();
  console.log(`[API] ✅ Resposta bem-sucedida`);
  return { data };
}

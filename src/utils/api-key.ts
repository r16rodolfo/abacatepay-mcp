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
  console.log(`[RESOLVE-API-KEY] Iniciando resolução de API key`);
  console.log(`[RESOLVE-API-KEY] API key fornecida como parâmetro:`, apiKey ? `${apiKey.substring(0, 10)}...` : 'não fornecida');
  
  // 1. Prioridade: parâmetro fornecido (mas ignora valores placeholder/inválidos)
  if (apiKey && apiKey.trim() !== '') {
    // Ignora valores placeholder comuns que indicam que o usuário não forneceu uma chave real
    const invalidPlaceholders = [
      'sua_chave_api', 'sua-chave-api', 'sua_chave', 'sua-chave',
      'your_api_key', 'your-api-key', 'your_api', 'your-api',
      'api_key_here', 'api-key-here', 'api_key', 'api-key',
      'chave_api', 'chave-api', 'chave', 'key'
    ];
    const normalizedApiKey = apiKey.toLowerCase().trim();
    const isPlaceholder = invalidPlaceholders.some(placeholder => 
      normalizedApiKey === placeholder.toLowerCase() || 
      normalizedApiKey.includes(placeholder.toLowerCase())
    );
    
    if (isPlaceholder) {
      console.log(`[RESOLVE-API-KEY] ⚠️ API key do parâmetro parece ser placeholder ("${apiKey}"), ignorando`);
    } else {
      console.log(`[RESOLVE-API-KEY] ✅ Usando API key do parâmetro`);
      return apiKey;
    }
  }
  
  // 2. Prioridade: contexto da sessão
  const sessionId = getCurrentSessionId();
  console.log(`[RESOLVE-API-KEY] Session ID atual:`, sessionId || 'não definido');
  const sessionApiKey = getSessionApiKey(sessionId);
  console.log(`[RESOLVE-API-KEY] API key da sessão:`, sessionApiKey ? `${sessionApiKey.substring(0, 10)}...` : 'não encontrada');
  
  if (sessionApiKey && sessionApiKey.trim() !== '') {
    console.log(`[RESOLVE-API-KEY] ✅ Usando API key do contexto da sessão`);
    return sessionApiKey;
  }
  
  // 3. Prioridade: variável global
  const globalApiKey = validateApiKey();
  console.log(`[RESOLVE-API-KEY] API key global:`, globalApiKey ? `${globalApiKey.substring(0, 10)}...` : 'não configurada');
  
  if (globalApiKey && globalApiKey.trim() !== '') {
    console.log(`[RESOLVE-API-KEY] ✅ Usando API key global`);
    return globalApiKey;
  }
  
  console.log(`[RESOLVE-API-KEY] ❌ Nenhuma API key encontrada`);
  return null;
}



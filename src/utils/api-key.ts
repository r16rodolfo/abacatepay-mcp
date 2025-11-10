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
    
    if (!isPlaceholder) {
      return apiKey;
    }
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



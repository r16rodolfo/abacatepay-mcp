// Sistema de contexto para armazenar dados por sessão MCP
// Isso permite que as ferramentas acessem dados do contexto HTTP (como API keys)

interface SessionContext {
  apiKey?: string;
  sessionId?: string;
}

// Map para armazenar contexto por sessionId
const sessionContexts = new Map<string, SessionContext>();

// Contexto da sessão atual (usado quando não há sessionId disponível)
let currentSessionContext: SessionContext | null = null;

// Session ID atual
let currentSessionId: string | undefined = undefined;

export function setSessionApiKey(sessionId: string | undefined, apiKey: string) {
  if (sessionId) {
    const context = sessionContexts.get(sessionId) || {};
    context.apiKey = apiKey;
    context.sessionId = sessionId;
    sessionContexts.set(sessionId, context);
  } else {
    // Se não há sessionId, usa contexto global temporário
    currentSessionContext = { apiKey, sessionId: undefined };
  }
}

export function getSessionApiKey(sessionId?: string): string | undefined {
  if (sessionId) {
    const context = sessionContexts.get(sessionId);
    if (context?.apiKey) {
      return context.apiKey;
    }
  }
  
  // Tenta usar contexto global temporário
  if (currentSessionContext?.apiKey) {
    return currentSessionContext.apiKey;
  }
  
  return undefined;
}

export function clearSessionContext(sessionId: string) {
  sessionContexts.delete(sessionId);
}

export function setCurrentSessionId(sessionId: string | undefined) {
  currentSessionId = sessionId;
}

export function getCurrentSessionId(): string | undefined {
  return currentSessionId;
}


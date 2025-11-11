/**
 * Formata mensagens de erro HTTP de forma padronizada
 */
export function formatHttpError(error: Error, context?: Record<string, any>): string {
  let errorMessage = error.message;
  let errorDetails = '';
  
  // Extrai detalhes de erros HTTP
  if (error.message.includes('HTTP')) {
    const match = error.message.match(/HTTP (\d+): (.+)/);
    if (match) {
      const statusCode = match[1];
      const errorBody = match[2];
      
      try {
        const errorJson = JSON.parse(errorBody);
        errorDetails = `\n\nDetalhes do erro:\n${JSON.stringify(errorJson, null, 2)}`;
      } catch {
        errorDetails = `\n\nResposta do servidor: ${errorBody}`;
      }
      
      // Mensagens específicas por status code
      switch (statusCode) {
        case '401':
          errorMessage = 'Erro de autenticação: API key inválida ou expirada';
          break;
        case '400':
          errorMessage = 'Erro de validação: Verifique se os dados estão corretos';
          break;
        case '404':
          errorMessage = 'Recurso não encontrado';
          break;
        case '500':
          errorMessage = 'Erro interno do servidor Abacate Pay';
          if (context) {
            errorMessage += '. Dados enviados:\n' + 
              Object.entries(context)
                .map(([key, value]) => `• ${key}: ${value}`)
                .join('\n');
          }
          break;
        default:
          errorMessage = `Erro HTTP ${statusCode}`;
      }
    }
  }
  
  return `${errorMessage}${errorDetails}`;
}


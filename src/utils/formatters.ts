// Funções utilitárias para normalização e formatação de dados

/**
 * Normaliza CPF/CNPJ removendo formatação (pontos, traços, barras)
 */
export function normalizeTaxId(taxId: string): string {
  return taxId.replace(/\D/g, '');
}

/**
 * Formata CPF no padrão brasileiro (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleaned = normalizeTaxId(cpf);
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
}

/**
 * Normaliza número de celular removendo formatação e adicionando código do país se necessário
 */
export function normalizeCellphone(cellphone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = cellphone.replace(/\D/g, '');
  
  // Se já começar com 55 (código do Brasil), retorna como está
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  
  // Se tiver 11 dígitos (formato brasileiro sem código do país), adiciona 55
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }
  
  // Caso contrário, retorna como está
  return cleaned;
}

/**
 * Formata celular brasileiro para exibição (XX) XXXXX-XXXX
 */
export function formatCellphone(cellphone: string): string {
  const cleaned = normalizeCellphone(cellphone);
  
  // Se tiver 11 dígitos, formata como celular brasileiro
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  // Se tiver 13 dígitos (com código do país), remove o código para formatação
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const withoutCountryCode = cleaned.slice(2);
    return `(${withoutCountryCode.slice(0, 2)}) ${withoutCountryCode.slice(2, 7)}-${withoutCountryCode.slice(7)}`;
  }
  
  return cellphone;
}


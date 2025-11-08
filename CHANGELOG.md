# abacatepay-mcp

## 1.0.7

### Major Changes

- Refatoração completa do código para melhor organização e manutenibilidade
  - Modularização: Funções utilitárias movidas para `src/utils/` (formatters, api-key, errors)
  - Middleware HTTP movido para `src/http/middleware.ts`
  - HTTP server reorganizado para `src/http/server.ts`
  - Sistema de contexto de API key implementado em todas as ferramentas
  - Tratamento de erros padronizado em todas as ferramentas

## 1.0.5

### Patch Changes

- 7502e34: Corrige problema de dependências faltando ao executar via NPX

  - Implementa bundling com esbuild para incluir todas as dependências em um único arquivo
  - Resolve erro "Cannot find package '@modelcontextprotocol/sdk'"
  - Agora funciona perfeitamente com `npx abacatepay-mcp` sem necessidade de instalação manual
  - Bundle otimizado de ~261KB incluindo todas as dependências necessárias

## 1.0.4

### Patch Changes

- bff91cb: Corrige compatibilidade com Node.js 18+

  - Atualiza requisito do Node.js de >=22.16.0 para >=18.19.1
  - Adiciona shebang correto no arquivo executável
  - Melhora compatibilidade com a maioria das instalações do Node.js

## 1.0.2

### Patch Changes

- f020ec1: Migra sistema de release do release-it para Changesets. Isso melhora o processo de contribuição permitindo que contribuidores documentem suas próprias mudanças e facilita o gerenciamento de releases para mantenedores.

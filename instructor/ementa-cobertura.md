# Cobertura da ementa - Agentes de IA com JavaScript

Revisão realizada em 2 de outubro de 2026 com base na ementa pública do curso:

- <https://www.cotiinformatica.com.br/curso/agente-ia-javascript>

Este documento organiza a próxima turma em sete encontros. A primeira hora de cada encontro pode continuar reservada para interação e mercado; os roteiros priorizam aproximadamente duas horas de conteúdo técnico.

## Resultado da auditoria

Todos os itens publicados na ementa aparecem nos guias. Integração com API, banco de dados, MCP HTTP e frameworks são demonstrações previamente montadas para não consumir a aula com Docker, ORM, infraestrutura ou migração completa de framework.

| Módulo da ementa | Aula principal | Evidência no material | Situação |
| --- | --- | --- | --- |
| Introdução aos LLMs | Aula 1 | Primeira chamada, tokens, contexto, alucinação e cache | Coberto |
| Prompt Engineering e Structured Output | Aula 2 | Zero-shot, few-shot, instruções, Zod e `responses.parse` | Coberto |
| De LLM para Agent | Aula 3 | Chatbot x workflow x agente e primeiras tools | Coberto |
| Construindo nosso próprio Agent Loop | Aula 3 | Loop manual, execução, retorno, encadeamento e limites | Coberto |
| Agentes trabalhando com dados reais | Aulas 4 e 7 | Tools com JSON, API REST pronta, SQLite em memória e execução sequencial | Coberto |
| Estado, memória e segurança | Aulas 4 e 5 | Histórico, `conversationId`, `Map`, autenticação, autorização, aprovação e Prompt Injection | Coberto |
| Introdução ao RAG e Embeddings | Aula 6 | Conhecimento privado, RAG, chunks, embeddings e busca semântica | Coberto |
| Pipeline de ingestão e Retrieval | Aula 6 | PDFs, upload, chunking, embeddings, vector stores e busca | Coberto |
| RAG integrado ao Agente | Aula 7 | `file_search`, RAG como tool e escolha entre dados e documentos | Coberto |
| Arquitetura moderna de Agentes e MCP | Aula 7 | Servidor, cliente, tools, resources, stdio, HTTP, Agents SDK e arquitetura final | Coberto |

# Conferência item por item

## Introdução aos LLMs

- [x] O que é um LLM
- [x] Como um LLM gera respostas
- [x] Tokens e contexto
- [x] Primeira chamada para um modelo utilizando Node.js

Arquivo: `instructor/guia-aula-01.html`.

## Prompt Engineering e Structured Output

- [x] Prompt Engineering
- [x] System Prompt e User Prompt
- [x] Contexto e instruções
- [x] Structured Output
- [x] Validação e utilização das respostas pela aplicação

Arquivo: `instructor/guia-aula-02.html`.

## De LLM para Agent

- [x] O que caracteriza um Agente de IA
- [x] Diferença entre chatbot, workflow e agente
- [x] Introdução ao Tool Calling
- [x] Criação das primeiras Tools

Arquivo: `instructor/guia-aula-03.html`.

## Construindo nosso próprio Agent Loop

- [x] Como funciona o ciclo de execução de um agente
- [x] Decisão entre responder ou executar uma Tool
- [x] Execução e retorno das Tools
- [x] Construção manual de um Agent Loop

Arquivo: `instructor/guia-aula-03.html`.

## Agentes trabalhando com dados reais

- [x] Criação de Tools reais
- [x] Integração com APIs
- [x] Integração com banco de dados
- [x] Execução sequencial de Tools

Arquivos: `instructor/guia-aula-04.html` e `instructor/guia-aula-07.html`.

### Decisão didática

- Os JSONs continuam sendo o banco operacional principal durante a construção.
- `src/examples/api-tools.ts` demonstra uma tool consumindo a API Express.
- `src/examples/database-tools.ts` demonstra o mesmo contrato usando SQLite em memória.
- Os alunos observam como substituir a fonte de dados sem precisar instalar Docker, PostgreSQL ou ORM.

## Estado, memória e segurança

- [x] Histórico de conversação
- [x] Estado e memória
- [x] Persistência de contexto
- [x] Segurança de agentes
- [x] Validação e autorização de ações
- [x] Prompt Injection

Arquivos: `instructor/guia-aula-04.html` e `instructor/guia-aula-05.html`.

### Decisão didática

O histórico, as aprovações e as alterações permanecem em memória. O professor explica onde entraria persistência externa, mas não interrompe o curso para configurar infraestrutura.

## Introdução ao RAG e Embeddings

- [x] Preparando o agente para conhecimento privado
- [x] O problema que o RAG resolve
- [x] Introdução ao RAG
- [x] Embeddings
- [x] Busca semântica

Arquivo: `instructor/guia-aula-06.html`.

## Pipeline de ingestão e Retrieval

- [x] Preparação de documentos
- [x] Chunking
- [x] Geração de embeddings
- [x] Armazenamento vetorial
- [x] Retrieval
- [x] Recuperação de contexto relevante

Arquivo: `instructor/guia-aula-06.html`.

### Decisão didática

O pipeline usa Vector Stores da OpenAI para evitar setup local. O guia também explica onde entraria PostgreSQL com pgvector, as diferenças operacionais, custos e ciclo de vida dos documentos.

## RAG integrado ao Agente

- [x] Construção do fluxo completo de RAG
- [x] Utilização do contexto recuperado pelo LLM
- [x] RAG como uma Tool
- [x] Decisão do agente sobre quando consultar a base de conhecimento

Arquivo: `instructor/guia-aula-07.html`.

## Arquitetura moderna de Agentes e MCP

- [x] Arquitetura completa do agente
- [x] Introdução ao MCP
- [x] MCP Client e MCP Server
- [x] Tools e Resources
- [x] Criação de uma integração MCP
- [x] Visão geral de frameworks para desenvolvimento de agentes
- [x] Consolidação da arquitetura construída durante o curso

Arquivo: `instructor/guia-aula-07.html`.

### Decisão didática

- MCP é construído primeiro com `stdio`.
- Streamable HTTP é executado e comparado com `stdio`.
- Publicação online, HTTPS e autenticação são explicadas sem exigir deploy durante a aula.
- OpenAI Agents SDK é demonstrado como abstração do Agent Loop já estudado.

# Referências técnicas oficiais

- [OpenAI SDKs e primeira chamada](https://developers.openai.com/api/docs/libraries)
- [Tools na Responses API](https://developers.openai.com/api/docs/guides/tools)
- [File search](https://developers.openai.com/api/docs/guides/tools-file-search)
- [Retrieval e vector stores](https://developers.openai.com/api/docs/guides/retrieval)
- [MCP](https://developers.openai.com/api/docs/guides/agents-api/tools/mcp)
- [OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents/sdk)

# Regra para manutenção

Depois de atualizar qualquer guia Markdown, execute:

```bash
npm run instructor:html
```

O comando recria os sete HTMLs. Antes de iniciar uma nova turma, repita também:

```bash
npm run typecheck
npm run build
git diff --check
```

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { marked } from 'marked'

const sources = {
  firstLessons: await readFile(
    resolve('instructor/guia-testes-aulas-01-02.md'),
    'utf8'
  ),
  lesson3: await readFile(
    resolve('instructor/guia-testes-aula-03.md'),
    'utf8'
  ),
  lesson4: await readFile(
    resolve('instructor/guia-testes-aula-04.md'),
    'utf8'
  ),
  lesson6: await readFile(
    resolve('instructor/guia-aula-06.md'),
    'utf8'
  ),
  lesson7: await readFile(
    resolve('instructor/guia-aula-07.md'),
    'utf8'
  )
}

function section(source, start, end) {
  const startIndex = source.indexOf(start)

  if (startIndex < 0) {
    throw new Error(`Seção inicial não encontrada: ${start}`)
  }

  const endIndex = end ? source.indexOf(end, startIndex) : source.length

  if (end && endIndex < 0) {
    throw new Error(`Seção final não encontrada: ${end}`)
  }

  return source.slice(startIndex, endIndex).trim()
}

const commonPreparation = section(
  sources.firstLessons,
  '## Preparação',
  '\n---\n\n# Aula 1'
)

const lesson1Source = `# Aula 1 - Introdução aos LLMs

Guia do professor para apresentar o projeto tradicional, fazer a primeira chamada ao modelo e discutir geração de respostas, tokens, contexto, alucinações e prompt caching.

## Como um LLM gera respostas

Um LLM aprende padrões estatísticos durante o treinamento. Na geração, recebe o contexto disponível e escolhe sucessivamente os próximos tokens mais adequados. Ele não consulta automaticamente os arquivos do projeto e não funciona como um banco de fatos garantidos.

\`\`\`text
texto de entrada
  -> tokenização
  -> modelo calcula probabilidades
  -> escolhe o próximo token
  -> repete até concluir a resposta
\`\`\`

O contexto é o conjunto de informações disponíveis naquela chamada. A janela de contexto tem limite, tokens têm custo e uma resposta linguisticamente convincente ainda pode estar incorreta.

${commonPreparation}

${section(
  sources.firstLessons,
  '# Aula 1 - O que é um LLM',
  '\n---\n\n# Aula 2'
)}

# Fechamento e checklist

- [ ] A API tradicional foi comparada com uma pergunta em linguagem natural.
- [ ] A primeira chamada com Node.js foi executada.
- [ ] Tokens de entrada, saída e raciocínio foram observados.
- [ ] Dados locais foram enviados explicitamente como contexto.
- [ ] Alucinação, contexto, memória e prompt caching foram diferenciados.
- [ ] A rota \`POST /chat\` foi testada.

## Perguntas para a turma

1. O modelo leu automaticamente os JSONs do projeto?
2. Por que duas execuções podem produzir textos diferentes?
3. Uma resposta plausível é necessariamente verdadeira?
4. Reutilizar o mesmo cliente do SDK cria memória?

## Respostas esperadas

1. Não. Somente dados enviados na requisição ficam disponíveis.
2. A geração é probabilística e pode escolher formulações diferentes.
3. Não. O modelo pode alucinar fatos convincentes.
4. Não. A aplicação precisa reenviar ou persistir o histórico.`

const lesson2Source = `# Aula 2 - Prompt Engineering e Structured Outputs

Guia do professor para transformar instruções vagas em contratos previsíveis, validar entradas e utilizar respostas estruturadas na aplicação.

## System Prompt e User Prompt

Na linguagem comum, **System Prompt** é o conjunto de regras de maior prioridade definido pela aplicação. Na Responses API usada no curso, essas regras são enviadas principalmente em \`instructions\`. O **User Prompt** é a solicitação enviada pelo usuário em \`input\`.

\`\`\`typescript
await client.responses.create({
  model,
  instructions: 'Responda apenas sobre a Pousada Parnaioca.',
  input: message
})
\`\`\`

As instruções definem papel, escopo, formato e restrições. O input fornece a tarefa e os dados do usuário. Uma frase como “ignore as instruções anteriores” continua sendo conteúdo do usuário e não deve substituir as regras da aplicação.

${commonPreparation}

${section(
  sources.firstLessons,
  '# Aula 2 - Prompt Engineering e Structured Outputs',
  '\n---\n\n# Checklist final'
)}

${section(sources.firstLessons, '# Checklist final')}`

const lesson3Source = sources.lesson3
  .replace(
    '# Guia de testes - Aula 3',
    `# Aula 3 - Tool Calling e Agent Loop

## Chatbot, workflow e agente

| Conceito | Comportamento principal | Exemplo |
| --- | --- | --- |
| Chatbot | Mantém uma conversa e produz respostas | Responder uma dúvida geral |
| Workflow | Segue uma sequência definida pela aplicação | Consultar sempre uma reserva e depois enviar uma mensagem |
| Agente | Decide dinamicamente quais passos e tools utilizar | Escolher entre consultar hóspede, reserva ou responder sem ferramenta |

Um agente combina modelo, instruções, ferramentas e um ciclo de execução. O modelo decide o próximo passo, mas a aplicação continua responsável por executar código, validar limites e controlar efeitos externos.`
  )

const lesson4Source = `# Aula 4 - Tools reais, contexto e memória

Esta aula amplia o agente com várias ferramentas encadeadas e mostra como a aplicação mantém histórico, estado e memória entre requisições.

## Objetivos da aula

- criar uma nova tool sem reescrever o Agent Loop;
- executar tools sequencialmente para concluir uma tarefa;
- diferenciar contexto, histórico, estado, memória e persistência;
- isolar conversas por usuário e identificador;
- discutir onde APIs e bancos reais substituiriam os dados em memória.

## Contexto, histórico, estado, memória e persistência

| Conceito | Significado neste projeto |
| --- | --- |
| Contexto | Itens enviados ao modelo na chamada atual |
| Histórico | Sequência de mensagens e resultados de tools da conversa |
| Estado | Valores atuais da aplicação, como contadores e aprovações |
| Memória | Informação recuperada e reutilizada em outra interação |
| Persistência | Armazenamento que sobrevive ao reinício do processo |

O \`Map\` usado no curso mantém histórico e estado apenas enquanto a API está executando. Ele demonstra o comportamento sem exigir banco, mas não oferece persistência durável.

${section(
  sources.lesson4,
  '## Preparação',
  '\n---\n\n# Parte 1'
)}

${section(sources.lesson4, '# Parte 1', '\n# Parte 3')}

# Onde entram APIs e bancos reais

As funções usadas pelas tools são a fronteira de integração. Na aula, elas consultam arrays e JSONs para manter o foco no agente. Em produção, o corpo dessas mesmas funções poderia chamar uma API com \`fetch\` ou consultar um banco com um driver ou ORM.

\`\`\`text
Modelo escolhe a tool
  -> Agent Loop valida os argumentos
  -> função da aplicação consulta JSON, API ou banco
  -> resultado volta como function_call_output
  -> modelo produz a resposta final
\`\`\`

O modelo não deve receber credenciais do banco e não executa SQL livre. A aplicação mantém o controle da consulta, dos limites e dos dados retornados.

# Checklist de encerramento

- [ ] \`getBedroomById\` foi adicionada sem mudar a estrutura do loop.
- [ ] Uma tarefa utilizou tools em sequência.
- [ ] O mesmo \`conversationId\` preservou o contexto.
- [ ] Outro identificador não herdou o histórico.
- [ ] Foi explicado que memória em \`Map\` desaparece no reinício.
- [ ] Foi mostrado onde uma API ou um banco entraria na implementação da tool.
- [ ] \`npm run typecheck\` e \`npm run build\` terminaram sem erros.`

const lesson5Source = `# Aula 5 - Estado, memória e segurança

Esta aula protege o agente construído nas aulas anteriores. A aplicação passa a identificar o usuário, limitar ferramentas por perfil, resistir a Prompt Injection e exigir aprovação humana para ações sensíveis.

## Objetivos da aula

- diferenciar autenticação de autorização;
- tratar prompt como orientação, não como barreira de segurança;
- aplicar autorização antes e durante a execução das tools;
- isolar o histórico por usuário;
- validar ações sensíveis com aprovação humana;
- reconhecer os limites do armazenamento em memória.

${section(
  sources.lesson6,
  '## Preparação do professor',
  '\n# Primeira hora'
)}

${section(sources.lesson6, '# Bloco 1', '\n# Bloco 5')}

# Testes finais da aula

Use também os cenários completos de aprovação descritos em \`instructor/guia-testes-aula-04.md\`:

- chamada sem token deve retornar \`401\`;
- token inválido deve retornar \`401\`;
- hóspede não recebe tools com dados pessoais;
- funcionário autorizado consulta hóspedes e reservas;
- o mesmo \`conversationId\` não compartilha histórico entre usuários;
- funcionário não aprova cancelamento;
- gerente pode aprovar ou rejeitar;
- a mesma solicitação não pode ser decidida duas vezes.

# Checklist de encerramento

- [ ] Prompt Injection foi demonstrado como tentativa, não como autorização.
- [ ] Autenticação e autorização foram diferenciadas.
- [ ] As tools foram filtradas conforme o perfil.
- [ ] O executor validou novamente a permissão.
- [ ] O histórico foi isolado por usuário.
- [ ] A operação sensível exigiu aprovação humana.
- [ ] Foi explicado que estado em memória não é persistência durável.`

const lesson6Source = `# Aula 6 - Introdução ao RAG, embeddings e retrieval

Esta aula prepara o agente para consultar conhecimento privado. Os documentos da pousada são classificados, enviados, divididos em chunks, transformados em embeddings, indexados e recuperados por busca semântica.

## Objetivos da aula

- explicar o problema resolvido pelo RAG;
- diferenciar chunks, embeddings e documentos originais;
- compreender busca semântica e retrieval;
- criar bases pública e interna;
- executar o pipeline de ingestão;
- discutir custos, atualização, exclusão e o lugar de bancos vetoriais reais.

${section(
  sources.lesson6,
  '## Preparação do professor',
  '\n# Primeira hora'
)}

${section(sources.lesson6, '# Bloco 5', '\n# Checklist do professor')}

# Checklist do professor

- [ ] O problema do conhecimento privado foi demonstrado.
- [ ] RAG foi diferenciado de treinamento do modelo.
- [ ] Chunks e embeddings foram definidos separadamente.
- [ ] Os documentos públicos e internos foram classificados.
- [ ] O pipeline criou vector stores e processou os PDFs.
- [ ] A busca semântica foi executada com termos diferentes dos documentos.
- [ ] Foi explicado onde pgvector ou outro banco vetorial entraria.
- [ ] Custos e ciclo de vida dos documentos foram discutidos.
- [ ] Foi demonstrado que autorização continua sendo responsabilidade da aplicação.

${section(sources.lesson6, '# Correspondência com a ementa')}`

const lesson7Source = sources.lesson7.replace(
  '# Aula real 07 - RAG integrado, MCP e arquitetura final',
  '# Aula 7 - RAG integrado, MCP e arquitetura final'
)

const guides = [
  {
    number: '01',
    title: 'Introdução aos LLMs',
    description: 'Primeira chamada, tokens, contexto, alucinações e prompt caching.',
    chips: ['LLMs', 'Responses API', 'Tokens', 'Contexto'],
    source: lesson1Source
  },
  {
    number: '02',
    title: 'Prompt Engineering e Structured Outputs',
    description: 'Instruções, zero-shot, few-shot, schemas e validação das respostas.',
    chips: ['Prompts', 'Structured Outputs', 'Zod', 'Validação'],
    source: lesson2Source
  },
  {
    number: '03',
    title: 'Tool Calling e Agent Loop',
    description: 'Primeiras tools, execução manual, encadeamento e limites do loop.',
    chips: ['Tool Calling', 'Agent Loop', 'Function output', 'Limites'],
    source: lesson3Source
  },
  {
    number: '04',
    title: 'Tools reais, contexto e memória',
    description: 'Execução sequencial, histórico, estado, memória e integração de dados.',
    chips: ['Tools reais', 'Histórico', 'Memória', 'Dados'],
    source: lesson4Source
  },
  {
    number: '05',
    title: 'Estado, memória e segurança',
    description: 'Autenticação, autorização, Prompt Injection e aprovação humana.',
    chips: ['Autenticação', 'Autorização', 'Prompt Injection', 'Aprovação'],
    source: lesson5Source
  },
  {
    number: '06',
    title: 'Introdução ao RAG, embeddings e retrieval',
    description: 'Documentos, chunks, embeddings, vector stores e busca semântica.',
    chips: ['RAG', 'Chunks', 'Embeddings', 'Retrieval'],
    source: lesson6Source
  },
  {
    number: '07',
    title: 'RAG integrado, MCP e arquitetura final',
    description: 'RAG no agente, MCP local e HTTP, frameworks, APIs e banco em memória.',
    chips: ['RAG + file_search', 'MCP stdio + HTTP', 'Agents SDK', 'API + SQLite'],
    source: lesson7Source
  }
]

function renderGuide({ number, title, description, chips, content }) {
  const quickTargets = Array.from(
    content.matchAll(/<h1>(.*?)<\/h1>/g),
    (match) => match[1].replace(/<[^>]+>/g, '')
  ).slice(1, 10)

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Guia do professor da Aula ${Number(number)}: ${title}.">
  <title>Aula ${Number(number)} — ${title}</title>
  <style>
    :root {
      color-scheme: light;
      --navy: #072f58;
      --blue: #075ba6;
      --blue-2: #1382d2;
      --cyan: #27b9d6;
      --paper: #f3f7fb;
      --surface: #ffffff;
      --surface-2: #f7faff;
      --ink: #172334;
      --muted: #5d6b7c;
      --line: #d8e3ee;
      --code: #0b1726;
      --code-bar: #12263c;
      --code-ink: #e9f2fb;
      --success: #11734b;
      --success-bg: #eaf7f0;
      --warning: #966000;
      --warning-bg: #fff7e5;
      --shadow: 0 14px 36px rgba(7, 47, 88, .09);
      --sidebar: 330px;
    }

    [data-theme="dark"] {
      color-scheme: dark;
      --paper: #08111d;
      --surface: #0e1a29;
      --surface-2: #122235;
      --ink: #e8f0f8;
      --muted: #a9b8c8;
      --line: #26394d;
      --code: #050b12;
      --code-bar: #0a1522;
      --success-bg: #102a22;
      --warning-bg: #30240f;
      --shadow: 0 14px 36px rgba(0, 0, 0, .28);
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-padding-top: 86px; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font: 400 15.5px/1.72 Inter, ui-sans-serif, system-ui, -apple-system,
        BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    button, input { font: inherit; }
    a { color: var(--blue); }

    .progress {
      position: fixed;
      inset: 0 auto auto 0;
      z-index: 100;
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--cyan), #5aa8ff);
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      height: 64px;
      background: color-mix(in srgb, var(--surface) 94%, transparent);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(16px);
    }
    .topbar-inner {
      max-width: 1540px;
      height: 100%;
      margin: 0 auto;
      padding: 0 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .brand-mark {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      color: white;
      background: linear-gradient(145deg, var(--navy), var(--blue-2));
      font-weight: 800;
      letter-spacing: -.04em;
      box-shadow: 0 5px 12px rgba(7, 91, 166, .25);
    }
    .brand-text { min-width: 0; line-height: 1.2; }
    .brand-text strong { display: block; color: var(--navy); }
    [data-theme="dark"] .brand-text strong { color: #a8d8ff; }
    .brand-text span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .top-actions { display: flex; align-items: center; gap: 8px; }
    .icon-button {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      color: var(--ink);
      cursor: pointer;
    }
    .icon-button:hover { background: var(--surface-2); }
    .menu-button { display: none; }

    .hero {
      position: relative;
      overflow: hidden;
      color: white;
      background:
        radial-gradient(circle at 84% 24%, rgba(39, 185, 214, .34), transparent 24%),
        linear-gradient(125deg, #062b50 0%, #075b9f 68%, #0f79be 100%);
    }
    .hero::before {
      content: "";
      position: absolute;
      width: 500px;
      height: 500px;
      right: -230px;
      bottom: -360px;
      border: 70px solid rgba(255, 255, 255, .07);
      border-radius: 50%;
    }
    .hero-inner {
      max-width: 1540px;
      margin: 0 auto;
      padding: 42px 24px 68px;
      position: relative;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 11px;
      border: 1px solid rgba(255, 255, 255, .28);
      border-radius: 999px;
      background: rgba(255, 255, 255, .1);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: .11em;
      text-transform: uppercase;
    }
    .hero h1 {
      max-width: 940px;
      margin: 16px 0 10px;
      font-size: clamp(30px, 4vw, 54px);
      line-height: 1.08;
      letter-spacing: -.035em;
      text-wrap: balance;
    }
    .hero p { max-width: 860px; margin: 0; color: #dceeff; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
    .chip {
      padding: 7px 11px;
      border-radius: 8px;
      background: rgba(255, 255, 255, .13);
      border: 1px solid rgba(255, 255, 255, .17);
      font-size: 12px;
      font-weight: 650;
    }

    .quickbar {
      max-width: 1540px;
      margin: -27px auto 0;
      padding: 0 24px;
      position: relative;
      z-index: 3;
    }
    .quickbar-inner {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--surface);
      box-shadow: var(--shadow);
      scrollbar-width: thin;
    }
    .quick-link {
      flex: none;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 9px;
      color: var(--ink);
      background: var(--surface-2);
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
    }
    .quick-link:hover { color: var(--blue); border-color: var(--blue-2); }

    .shell {
      max-width: 1540px;
      margin: 0 auto;
      padding: 28px 24px 64px;
      display: grid;
      grid-template-columns: var(--sidebar) minmax(0, 1fr);
      gap: 26px;
      align-items: start;
    }
    .sidebar {
      position: sticky;
      top: 82px;
      max-height: calc(100vh - 102px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    .sidebar-head { padding: 16px 16px 12px; border-bottom: 1px solid var(--line); }
    .sidebar-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      color: var(--navy);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .09em;
      text-transform: uppercase;
    }
    [data-theme="dark"] .sidebar-title { color: #a8d8ff; }
    .shortcut { color: var(--muted); font-size: 10px; letter-spacing: 0; }
    .search {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 9px;
      outline: none;
      color: var(--ink);
      background: var(--surface-2);
      font-size: 13px;
    }
    .search:focus { border-color: var(--blue-2); box-shadow: 0 0 0 3px rgba(19, 130, 210, .12); }
    .nav { overflow-y: auto; padding: 10px; scrollbar-width: thin; }
    .nav-group { margin: 2px 0 6px; }
    .nav-group summary {
      list-style: none;
      cursor: pointer;
      border-radius: 9px;
    }
    .nav-group summary::-webkit-details-marker { display: none; }
    .nav-main {
      display: block;
      padding: 8px 10px;
      border-radius: 9px;
      color: var(--ink);
      text-decoration: none;
      font-size: 12.5px;
      font-weight: 720;
      line-height: 1.35;
    }
    .nav-sub {
      display: block;
      margin-left: 12px;
      padding: 6px 9px 6px 14px;
      border-left: 1px solid var(--line);
      color: var(--muted);
      text-decoration: none;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .nav a:hover { color: var(--blue); background: var(--surface-2); }
    .nav a.active {
      color: var(--blue);
      background: color-mix(in srgb, var(--blue) 10%, var(--surface));
      box-shadow: inset 3px 0 0 var(--blue-2);
    }
    .nav-empty { padding: 14px; color: var(--muted); font-size: 12px; text-align: center; }

    main {
      min-width: 0;
      padding: clamp(24px, 4vw, 56px);
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    main > h1:first-child { display: none; }
    main h1, main h2, main h3, main h4 { scroll-margin-top: 86px; }
    main h1 {
      margin: 68px 0 22px;
      padding: 18px 20px;
      border-radius: 13px;
      color: white;
      background: linear-gradient(125deg, var(--navy), var(--blue));
      font-size: clamp(23px, 3vw, 31px);
      line-height: 1.25;
      letter-spacing: -.025em;
    }
    main h1:nth-of-type(2) { margin-top: 0; }
    main h2 {
      margin: 42px 0 14px;
      padding-bottom: 9px;
      border-bottom: 1px solid var(--line);
      color: var(--navy);
      font-size: 21px;
      line-height: 1.3;
    }
    [data-theme="dark"] main h2 { color: #a8d8ff; }
    main h3 { margin: 30px 0 11px; font-size: 17px; color: var(--blue); }
    main h4 { margin: 24px 0 8px; font-size: 15px; }
    main p { margin: 0 0 15px; }
    main ul, main ol { margin: 0 0 18px; padding-left: 24px; }
    main li { margin: 5px 0; }
    main strong { color: color-mix(in srgb, var(--ink) 88%, var(--blue)); }
    main blockquote {
      margin: 20px 0;
      padding: 16px 19px;
      border: 1px solid var(--line);
      border-left: 4px solid var(--blue-2);
      border-radius: 10px;
      background: var(--surface-2);
      color: var(--ink);
    }
    main blockquote p:last-child { margin-bottom: 0; }
    main hr { margin: 48px 0; border: 0; border-top: 1px solid var(--line); }
    main :not(pre) > code {
      padding: 2px 6px;
      border: 1px solid var(--line);
      border-radius: 5px;
      color: var(--blue);
      background: var(--surface-2);
      font: 500 .88em ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .table-wrap { max-width: 100%; overflow-x: auto; margin: 18px 0 24px; }
    main table { width: 100%; border-collapse: collapse; min-width: 560px; font-size: 13px; }
    main th, main td { padding: 10px 12px; border: 1px solid var(--line); text-align: left; vertical-align: top; }
    main th { color: var(--navy); background: var(--surface-2); }
    [data-theme="dark"] main th { color: #a8d8ff; }

    .code-block {
      margin: 18px 0 23px;
      overflow: hidden;
      border: 1px solid #21374d;
      border-radius: 12px;
      background: var(--code);
      box-shadow: 0 7px 18px rgba(4, 16, 29, .18);
    }
    .code-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 7px 10px 7px 15px;
      color: #9fb6cb;
      background: var(--code-bar);
      font-size: 10px;
      font-weight: 750;
      letter-spacing: .09em;
      text-transform: uppercase;
    }
    .code-lang::before {
      content: "";
      display: inline-block;
      width: 7px;
      height: 7px;
      margin-right: 8px;
      border-radius: 50%;
      background: #3ea6ff;
    }
    .copy-button {
      padding: 4px 9px;
      border: 1px solid #34516c;
      border-radius: 6px;
      color: #d7e8f8;
      background: transparent;
      cursor: pointer;
      font-size: 10px;
      text-transform: none;
      letter-spacing: 0;
    }
    .copy-button:hover { background: #1a334c; }
    .code-block pre { margin: 0; padding: 17px 19px; overflow-x: auto; }
    .code-block code {
      color: var(--code-ink);
      font: 400 12.5px/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      tab-size: 2;
    }

    .back-top {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 20;
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 12px;
      color: white;
      background: var(--blue);
      box-shadow: 0 8px 22px rgba(7, 91, 166, .28);
      cursor: pointer;
      opacity: 0;
      transform: translateY(8px);
      pointer-events: none;
      transition: .2s ease;
    }
    .back-top.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .overlay { display: none; }

    footer {
      padding: 25px;
      color: #c7d7e7;
      background: var(--navy);
      text-align: center;
      font-size: 12px;
    }

    @media (max-width: 980px) {
      :root { --sidebar: 320px; }
      .menu-button { display: grid; }
      .shell { display: block; }
      .sidebar {
        position: fixed;
        inset: 64px auto 0 0;
        z-index: 45;
        width: min(88vw, var(--sidebar));
        max-height: none;
        border-radius: 0 16px 16px 0;
        transform: translateX(-105%);
        transition: transform .23s ease;
      }
      body.menu-open .sidebar { transform: translateX(0); }
      .overlay {
        position: fixed;
        inset: 64px 0 0;
        z-index: 40;
        background: rgba(2, 10, 19, .48);
      }
      body.menu-open .overlay { display: block; }
    }

    @media (max-width: 600px) {
      .topbar-inner, .hero-inner, .quickbar, .shell { padding-left: 14px; padding-right: 14px; }
      .brand-text span { display: none; }
      .hero-inner { padding-top: 30px; padding-bottom: 54px; }
      .hero h1 { font-size: 31px; }
      main { padding: 22px 16px 38px; border-radius: 14px; }
      main h1 { margin-left: -4px; margin-right: -4px; padding: 15px; font-size: 22px; }
      main h2 { font-size: 19px; }
      .back-top { right: 14px; bottom: 14px; }
    }

    @media print {
      @page { margin: 14mm; }
      body { background: white; font-size: 10.5pt; }
      .progress, .topbar, .quickbar, .sidebar, .overlay, .back-top, .copy-button { display: none !important; }
      .hero { color: #111; background: white; }
      .hero-inner { max-width: none; padding: 0 0 18px; }
      .hero p { color: #333; }
      .eyebrow, .chip { color: #111; border-color: #aaa; background: white; }
      .shell { display: block; max-width: none; padding: 0; }
      main { padding: 0; border: 0; box-shadow: none; }
      main h1 { color: #111; background: #eaf2f9; break-after: avoid; }
      main h2, main h3 { break-after: avoid; }
      .code-block, table, blockquote { break-inside: avoid; }
      .code-block pre { white-space: pre-wrap; }
      footer { display: none; }
    }
  </style>
</head>
<body>
  <div class="progress" id="progress"></div>

  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <button class="icon-button menu-button" id="menu-button" aria-label="Abrir menu">☰</button>
        <div class="brand-mark">C</div>
        <div class="brand-text">
          <strong>COTI Informática</strong>
          <span>Agentes de IA com JavaScript · Guia do professor</span>
        </div>
      </div>
      <div class="top-actions">
        <button class="icon-button" id="theme-button" title="Alternar tema" aria-label="Alternar tema">◐</button>
        <button class="icon-button" onclick="window.print()" title="Imprimir" aria-label="Imprimir">⎙</button>
      </div>
    </div>
  </header>

  <section class="hero">
    <div class="hero-inner">
      <span class="eyebrow">Aula ${number} · guia do professor</span>
      <h1>${title}</h1>
      <p>${description} Material navegável com conceitos, código, testes, perguntas e respostas esperadas.</p>
      <div class="chips">
        ${chips.map((chip) => `<span class="chip">${chip}</span>`).join('\n        ')}
      </div>
    </div>
  </section>

  <div class="quickbar">
    <nav class="quickbar-inner" id="quick-links" aria-label="Atalhos principais"></nav>
  </div>

  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-head">
        <div class="sidebar-title">
          <span>Tópicos da aula</span>
          <span class="shortcut">pressione /</span>
        </div>
        <input class="search" id="search" type="search" placeholder="Buscar tópico..." autocomplete="off">
      </div>
      <nav class="nav" id="nav" aria-label="Menu da aula"></nav>
    </aside>

    <main id="content">
      ${content}
    </main>
  </div>

  <div class="overlay" id="overlay"></div>
  <button class="back-top" id="back-top" title="Voltar ao topo" aria-label="Voltar ao topo">↑</button>

  <footer>
    Pousada Parnaioca · Curso de Agentes de IA com JavaScript · Prof. Vitor Esteves
  </footer>

  <script>
    (function () {
      var root = document.documentElement
      var body = document.body
      var content = document.getElementById('content')
      var nav = document.getElementById('nav')
      var search = document.getElementById('search')
      var quickLinks = document.getElementById('quick-links')
      var progress = document.getElementById('progress')
      var backTop = document.getElementById('back-top')
      var themeButton = document.getElementById('theme-button')
      var menuButton = document.getElementById('menu-button')
      var overlay = document.getElementById('overlay')

      function slugify(text) {
        return text
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }

      var usedIds = new Map()
      var headings = Array.from(content.querySelectorAll('h1, h2'))

      headings.forEach(function (heading) {
        var base = slugify(heading.textContent) || 'secao'
        var count = usedIds.get(base) || 0
        usedIds.set(base, count + 1)
        heading.id = count ? base + '-' + (count + 1) : base
      })

      Array.from(content.querySelectorAll('table')).forEach(function (table) {
        var wrap = document.createElement('div')
        wrap.className = 'table-wrap'
        table.parentNode.insertBefore(wrap, table)
        wrap.appendChild(table)
      })

      Array.from(content.querySelectorAll('pre')).forEach(function (pre) {
        var code = pre.querySelector('code')
        if (!code) return

        var languageClass = Array.from(code.classList).find(function (name) {
          return name.indexOf('language-') === 0
        })
        var language = languageClass
          ? languageClass.replace('language-', '')
          : 'código'

        var wrapper = document.createElement('div')
        wrapper.className = 'code-block'

        var header = document.createElement('div')
        header.className = 'code-head'

        var label = document.createElement('span')
        label.className = 'code-lang'
        label.textContent = language

        var button = document.createElement('button')
        button.className = 'copy-button'
        button.type = 'button'
        button.textContent = 'Copiar'
        button.addEventListener('click', async function () {
          try {
            if (navigator.clipboard && window.isSecureContext) {
              await navigator.clipboard.writeText(code.textContent)
            } else {
              var copyArea = document.createElement('textarea')
              copyArea.value = code.textContent
              copyArea.setAttribute('readonly', '')
              copyArea.style.position = 'fixed'
              copyArea.style.opacity = '0'
              document.body.appendChild(copyArea)
              copyArea.select()
              document.execCommand('copy')
              copyArea.remove()
            }

            button.textContent = 'Copiado!'
          } catch {
            button.textContent = 'Não copiou'
          }

          window.setTimeout(function () {
            button.textContent = 'Copiar'
          }, 1400)
        })

        header.append(label, button)
        pre.parentNode.insertBefore(wrapper, pre)
        wrapper.append(header, pre)
      })

      var groups = []
      var currentGroup = null

      headings.slice(1).forEach(function (heading) {
        if (heading.tagName === 'H1') {
          currentGroup = {
            heading: heading,
            children: []
          }
          groups.push(currentGroup)
        } else if (currentGroup) {
          currentGroup.children.push(heading)
        }
      })

      function makeLink(heading, className) {
        var link = document.createElement('a')
        link.href = '#' + heading.id
        link.textContent = heading.textContent
        link.className = className
        link.dataset.target = heading.id
        link.addEventListener('click', function () {
          body.classList.remove('menu-open')
        })
        return link
      }

      groups.forEach(function (group, index) {
        var details = document.createElement('details')
        details.className = 'nav-group'
        details.open = index < 2

        var summary = document.createElement('summary')
        summary.appendChild(makeLink(group.heading, 'nav-main'))
        details.appendChild(summary)

        group.children.forEach(function (heading) {
          details.appendChild(makeLink(heading, 'nav-sub'))
        })

        nav.appendChild(details)
      })

      var quickLabels = ${JSON.stringify(quickTargets)}
      var quickTargets = headings
        .slice(1)
        .filter(function (heading) { return heading.tagName === 'H1' })
        .slice(0, quickLabels.length)
        .map(function (heading, index) {
          return [quickLabels[index], heading.id]
        })

      quickTargets.forEach(function (item) {
        var target = document.getElementById(item[1])
        if (!target) return
        var link = document.createElement('a')
        link.className = 'quick-link'
        link.href = '#' + item[1]
        link.textContent = item[0]
        quickLinks.appendChild(link)
      })

      var navLinks = Array.from(nav.querySelectorAll('a'))
      var observed = headings.slice(1)
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (entry) { return entry.isIntersecting })
          .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top })

        if (!visible.length) return
        var id = visible[0].target.id

        navLinks.forEach(function (link) {
          var active = link.dataset.target === id
          link.classList.toggle('active', active)
          if (active) {
            var details = link.closest('details')
            if (details) details.open = true
          }
        })
      }, {
        rootMargin: '-78px 0px -72% 0px',
        threshold: 0
      })

      observed.forEach(function (heading) {
        observer.observe(heading)
      })

      search.addEventListener('input', function () {
        var query = search.value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
        var matches = 0

        Array.from(nav.querySelectorAll('.nav-group')).forEach(function (group) {
          var links = Array.from(group.querySelectorAll('a'))
          var groupMatch = false

          links.forEach(function (link) {
            var text = link.textContent
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
            var match = !query || text.includes(query)
            link.style.display = match ? '' : 'none'
            if (match) {
              groupMatch = true
              matches++
            }
          })

          group.style.display = groupMatch ? '' : 'none'
          if (query && groupMatch) group.open = true
        })

        var empty = nav.querySelector('.nav-empty')
        if (!matches && !empty) {
          empty = document.createElement('div')
          empty.className = 'nav-empty'
          empty.textContent = 'Nenhum tópico encontrado.'
          nav.appendChild(empty)
        } else if (matches && empty) {
          empty.remove()
        }
      })

      function updateScroll() {
        var documentHeight = document.documentElement.scrollHeight - window.innerHeight
        var ratio = documentHeight > 0 ? window.scrollY / documentHeight : 0
        progress.style.width = Math.min(100, ratio * 100) + '%'
        backTop.classList.toggle('visible', window.scrollY > 600)
      }

      window.addEventListener('scroll', updateScroll, { passive: true })
      updateScroll()

      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })

      function closeMenu() {
        body.classList.remove('menu-open')
      }

      menuButton.addEventListener('click', function () {
        body.classList.toggle('menu-open')
      })
      overlay.addEventListener('click', closeMenu)

      var savedTheme = localStorage.getItem('guia-aula-theme')
      if (savedTheme === 'dark') root.dataset.theme = 'dark'

      themeButton.addEventListener('click', function () {
        var dark = root.dataset.theme === 'dark'
        root.dataset.theme = dark ? 'light' : 'dark'
        localStorage.setItem('guia-aula-theme', dark ? 'light' : 'dark')
      })

      document.addEventListener('keydown', function (event) {
        if (event.key === '/' && document.activeElement !== search) {
          event.preventDefault()
          search.focus()
          search.select()
        }
        if (event.key === 'Escape') {
          search.value = ''
          search.dispatchEvent(new Event('input'))
          search.blur()
          closeMenu()
        }
      })
    })()
  </script>
</body>
</html>
`
}

for (const guide of guides) {
  const content = await marked.parse(guide.source, { gfm: true })
  const outputPath = resolve(`instructor/guia-aula-${guide.number}.html`)
  const html = renderGuide({ ...guide, content })

  await writeFile(outputPath, html)
  console.log(`HTML gerado em ${outputPath}`)
}

const indexCards = guides.map((guide) => `
  <a class="card" href="guia-aula-${guide.number}.html">
    <span class="number">Aula ${guide.number}</span>
    <h2>${guide.title}</h2>
    <p>${guide.description}</p>
    <span class="open">Abrir guia <strong>→</strong></span>
  </a>
`).join('')

const indexHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Guias do professor — Agentes de IA com JavaScript</title>
  <style>
    :root {
      color-scheme: light;
      --navy: #072f58;
      --blue: #075ba6;
      --cyan: #27b9d6;
      --paper: #f3f7fb;
      --surface: #fff;
      --ink: #172334;
      --muted: #5d6b7c;
      --line: #d8e3ee;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font: 400 16px/1.6 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .hero {
      color: white;
      background: radial-gradient(circle at 85% 20%, rgba(39,185,214,.35), transparent 24%), linear-gradient(125deg, #062b50, #075b9f 68%, #0f79be);
    }
    .hero-inner, main { width: min(1180px, calc(100% - 32px)); margin: auto; }
    .hero-inner { padding: 56px 0 72px; }
    .eyebrow { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { max-width: 820px; margin: 12px 0; font-size: clamp(34px, 5vw, 58px); line-height: 1.06; letter-spacing: -.04em; }
    .hero p { max-width: 760px; margin: 0; color: #dceeff; }
    main { padding: 38px 0 72px; }
    .intro {
      margin: -66px 0 30px;
      padding: 22px 24px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--surface);
      box-shadow: 0 14px 36px rgba(7,47,88,.12);
    }
    .intro strong { color: var(--navy); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .card {
      min-height: 240px;
      display: flex;
      flex-direction: column;
      padding: 26px;
      border: 1px solid var(--line);
      border-radius: 16px;
      color: var(--ink);
      background: var(--surface);
      text-decoration: none;
      box-shadow: 0 9px 25px rgba(7,47,88,.06);
      transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
    }
    .card:hover { transform: translateY(-3px); border-color: #69a9dc; box-shadow: 0 16px 32px rgba(7,47,88,.12); }
    .number { color: var(--blue); font-size: 12px; font-weight: 850; letter-spacing: .11em; text-transform: uppercase; }
    h2 { margin: 12px 0 8px; color: var(--navy); font-size: 25px; line-height: 1.2; }
    .card p { margin: 0 0 20px; color: var(--muted); }
    .open { margin-top: auto; color: var(--blue); font-weight: 750; }
    .audit {
      margin-top: 28px;
      padding: 26px;
      border-radius: 16px;
      color: white;
      background: var(--navy);
    }
    .audit h2 { margin-top: 0; color: white; }
    .audit a { color: #8fe8ff; font-weight: 750; }
    footer { padding: 24px; color: #c7d7e7; background: var(--navy); text-align: center; font-size: 13px; }
    @media (max-width: 720px) {
      .grid { grid-template-columns: 1fr; }
      .hero-inner { padding-top: 40px; }
      .card { min-height: 0; }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <div class="eyebrow">COTI Informática · Guia do professor</div>
      <h1>Agentes de IA com JavaScript</h1>
      <p>Índice navegável dos sete encontros, organizado para a próxima turma e revisado conforme a ementa oficial.</p>
    </div>
  </header>
  <main>
    <section class="intro">
      <strong>Estratégia didática:</strong> aproximadamente duas horas técnicas por encontro. APIs, banco de dados, MCP HTTP e frameworks aparecem com exemplos prontos, preservando o foco em agentes sem exigir setup de infraestrutura.
    </section>
    <section class="grid" aria-label="Aulas">
      ${indexCards}
    </section>
    <section class="audit">
      <h2>Ementa revisada</h2>
      <p>Todos os módulos e itens publicados pela COTI foram associados a uma ou mais aulas. A matriz detalha onde cada tópico aparece e quais demonstrações são intencionalmente simplificadas.</p>
      <a href="ementa-cobertura.md">Abrir matriz de cobertura da ementa →</a>
    </section>
  </main>
  <footer>Pousada Parnaioca · Curso de Agentes de IA com JavaScript · Prof. Vitor Esteves</footer>
</body>
</html>`

const indexPath = resolve('instructor/index.html')
await writeFile(indexPath, indexHtml)
console.log(`Índice gerado em ${indexPath}`)

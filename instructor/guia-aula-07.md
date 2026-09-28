# Aula real 07 - MCP local, MCP por HTTP e integração com o agente

## Visão geral

**Duração total:** 3 horas  
**Tempo previsto de interação e mercado:** 1 hora  
**Tempo técnico disponível:** aproximadamente 2 horas

Esta aula apresenta o Model Context Protocol, primeiro de maneira local com
`stdio` e depois pela rede com Streamable HTTP. O mesmo servidor MCP será
usado nos dois transportes.

Ao final da aula, os alunos deverão compreender:

- qual problema o MCP resolve;
- as responsabilidades do host, cliente e servidor MCP;
- a diferença entre tool, resource e transport;
- por que `stdio` normalmente representa uma integração local;
- como um cliente descobre e executa capacidades de um servidor MCP;
- como conectar as tools MCP ao agent loop da Responses API;
- como disponibilizar o mesmo servidor por Streamable HTTP;
- o que ainda seria necessário para publicar o servidor na internet com
  segurança.

## Legenda didática

- **[CONSTRUIR]**: alunos escrevem o código junto com o professor.
- **[DEMONSTRAR]**: o código fica pronto no repositório do professor e os
  alunos observam a execução.
- **[EXPLICAR]**: conteúdo conceitual apresentado no quadro ou por diagrama.

## O que construir e o que somente demonstrar

Para caber nas duas horas técnicas:

| Parte | Formato |
| --- | --- |
| Conceitos e arquitetura MCP | [EXPLICAR] |
| Servidor MCP com uma tool e um resource | [CONSTRUIR] |
| Cliente MCP por `stdio` | [CONSTRUIR] |
| Integração do MCP com o agente | [CONSTRUIR] |
| Streamable HTTP | [DEMONSTRAR] |
| Autenticação, publicação e frameworks | [EXPLICAR] |
| Tool consumindo uma API REST | [DEMONSTRAR] |
| Tool consultando SQLite em memória | [DEMONSTRAR] |

## Atalhos para as demonstrações finais

Os exemplos finais ficam perto do encerramento deste guia. Use estes atalhos
para encontrá-los rapidamente:

| Demonstração | Arquivo | Seção do guia | Comando |
| --- | --- | --- | --- |
| Framework de agentes | `src/frameworks/agents-sdk.ts` | Bloco 10 | `npm run framework:agents` |
| Tools consumindo API REST | `src/examples/api-tools.ts` | Bloco 11 | `npm run example:api` |
| Tools consultando banco | `src/examples/database-tools.ts` | Bloco 12 | `npm run example:database` |

Ordem sugerida para o fechamento:

```text
Agents SDK
  -> API Tools
  -> Database Tools
  -> chatbot x workflow x agente
  -> arquitetura completa
```

---

# Primeira hora - Interação e mercado

Este período permanece livre para conversa entre os alunos e discussão
sobre o mercado de TI.

Se houver oportunidade de conectar a conversa ao conteúdo, use:

1. Como uma IA poderia usar ferramentas pertencentes a outra empresa?
2. Toda integração com agentes precisa ser criada de maneira proprietária?
3. O que acontece quando cada fornecedor descreve suas ferramentas de um
   jeito diferente?
4. Um agente deveria receber acesso direto ao banco de dados da empresa?
5. Qual é a diferença entre disponibilizar uma API e disponibilizar uma
   ferramenta para um agente?

---

# Bloco 1 - O problema resolvido pelo MCP

**Tempo:** 10 minutos  
**Formato:** [EXPLICAR]

Até este ponto do curso, todas as function tools foram escritas diretamente
na aplicação:

```text
Agente Parnaioca
  ├─ definição de findGuest
  ├─ função findGuest
  ├─ definição de getBedroomById
  └─ função getBedroomById
```

Isso funciona, mas cria acoplamento. Cada novo agente precisa conhecer a
descrição, os argumentos e a forma de executar cada ferramenta.

Com MCP, um servidor publica suas capacidades usando um protocolo comum:

```text
Host do agente
  └─ Cliente MCP
       └─ Transporte
            └─ Servidor MCP da Parnaioca
                 ├─ tool: find_guest
                 └─ resource: bedrooms-catalog
```

## Definições

### Host

É a aplicação em que o agente está sendo executado. Neste projeto, o
script que usa a Responses API faz o papel de host.

### Cliente MCP

É o componente usado pelo host para se conectar a um servidor MCP. Ele
envia mensagens do protocolo, lista capacidades e solicita execuções.

### Servidor MCP

É o programa que anuncia e executa capacidades. Ele pode estar no mesmo
computador ou em outro serviço acessível pela rede.

### Tool

É uma capacidade executável. Recebe argumentos e pode consultar dados,
calcular ou provocar efeitos no mundo externo.

Exemplo:

```text
find_guest({ name: "João" })
```

### Resource

É um conteúdo que pode ser lido por meio de uma URI conhecida. Não
representa uma ação solicitada pelo modelo.

Exemplo:

```text
parnaioca://bedrooms/catalog
```

### Transport

É o canal por onde cliente e servidor trocam as mensagens MCP. Nesta aula
serão usados `stdio` e Streamable HTTP.

## Perguntas para a turma

1. MCP substitui o modelo de IA?
2. MCP substitui a API ou o banco de dados da empresa?
3. Quem executa a ferramenta: o modelo ou o servidor MCP?
4. Uma tool MCP precisa obrigatoriamente usar IA?

## Respostas esperadas

- MCP não é modelo e não substitui o agent loop.
- O servidor MCP pode encapsular uma API, banco ou outra regra de negócio.
- O modelo solicita; a aplicação e o servidor executam.
- Uma tool MCP pode ser apenas uma função determinística comum.

---

# Bloco 2 - Instalação dos pacotes

**Tempo:** 5 minutos  
**Formato:** [CONSTRUIR]

O projeto utiliza a linha 2 do SDK TypeScript do MCP, distribuída em pacotes
separados:

```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/client
```

Para a demonstração HTTP:

```bash
npm install @modelcontextprotocol/express @modelcontextprotocol/node
```

Responsabilidades:

- `@modelcontextprotocol/server`: cria o servidor, as tools e os resources;
- `@modelcontextprotocol/client`: cria clientes `stdio` e HTTP;
- `@modelcontextprotocol/express`: prepara o Express para servir MCP;
- `@modelcontextprotocol/node`: adapta requisições Node/Express ao handler
  MCP.

---

# Bloco 3 - Criar o servidor MCP uma única vez

**Tempo:** 20 minutos  
**Formato:** [CONSTRUIR]

Crie `src/mcp/create-server.ts`.

Esse arquivo não escolhe `stdio` ou HTTP. Ele registra apenas as capacidades
da Pousada Parnaioca. Essa separação permitirá reutilizar o mesmo servidor nos
dois transportes.

## Criar a instância

```typescript
import { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { bedrooms, guests } from '../data/index.js'

export function createParnaiocaMcpServer() {
  const server = new McpServer({
    name: 'parnaioca-mcp',
    version: '1.0.0'
  })

  // registros entram aqui

  return server
}
```

Cada conexão poderá receber uma nova instância desse servidor.

## Registrar a tool `find_guest`

```typescript
server.registerTool(
  'find_guest',
  {
    title: 'Buscar hóspede',
    description: 'Busca um hóspede cadastrado pelo nome.',
    inputSchema: z.object({
      name: z
        .string()
        .min(1)
        .describe('Nome ou parte do nome do hóspede')
    })
  },
  async ({ name }) => {
    const guest = guests.find((item) =>
      item.name
        .toLowerCase()
        .includes(name.toLowerCase())
    )

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(guest ?? null)
        }
      ]
    }
  }
)
```

Mostre as três partes:

1. nome usado pelo cliente: `find_guest`;
2. metadados e schema usados para descobrir como chamá-la;
3. callback que executa a regra de negócio.

O resultado MCP possui uma coleção `content`, pois o protocolo pode
representar diferentes tipos de conteúdo. Neste exemplo, a ferramenta devolve
texto contendo JSON.

## Registrar o resource de quartos

```typescript
server.registerResource(
  'bedrooms-catalog',
  'parnaioca://bedrooms/catalog',
  {
    title: 'Catálogo de quartos',
    description: 'Lista os quartos disponíveis na pousada.',
    mimeType: 'application/json'
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(bedrooms, null, 2)
      }
    ]
  })
)
```

## Tool ou resource?

| Necessidade | Capacidade |
| --- | --- |
| Buscar um hóspede usando um argumento | Tool |
| Solicitar cancelamento de uma reserva | Tool |
| Ler um catálogo por uma URI conhecida | Resource |
| Ler um manual ou configuração | Resource |

Essa separação não é uma fronteira de segurança. Tools e resources
sensíveis ainda exigem autorização.

---

# Bloco 4 - Servir MCP por `stdio`

**Tempo:** 5 minutos  
**Formato:** [CONSTRUIR]

Crie `src/mcp/server.ts`:

```typescript
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { createParnaiocaMcpServer } from './create-server.js'

serveStdio(createParnaiocaMcpServer)

console.error('Servidor MCP da Parnaioca iniciado')
```

Adicione ao `package.json`:

```json
"mcp:server": "tsx src/mcp/server.ts"
```

## Por que `console.error`?

No transporte `stdio`, a saída padrão faz parte do canal usado pelo
protocolo. Um `console.log` arbitrário no servidor pode misturar texto de
depuração com as mensagens MCP.

`console.error` escreve em `stderr`, deixando `stdout` livre para o protocolo.

## Característica do `stdio`

```text
Cliente local
  └─ inicia um processo filho
       └─ servidor MCP
```

Ele é adequado para integrações locais, CLIs e ferramentas instaladas na
máquina do usuário. Não cria um endpoint acessível pela internet.

---

# Bloco 5 - Criar o cliente MCP local

**Tempo:** 15 minutos  
**Formato:** [CONSTRUIR]

Crie `src/mcp/client.ts`.

## Criar o cliente e o transporte

```typescript
import { Client } from '@modelcontextprotocol/client'
import {
  StdioClientTransport
} from '@modelcontextprotocol/client/stdio'

const client = new Client({
  name: 'parnaioca-client',
  version: '1.0.0'
})

const transport = new StdioClientTransport({
  command: 'npx',
  args: [
    'tsx',
    'src/mcp/server.ts'
  ]
})
```

O cliente não se conecta a um processo que abrimos manualmente. O transporte
executa o comando e cria o processo filho do servidor.

## Conectar e descobrir as tools

```typescript
await client.connect(transport)

const { tools } = await client.listTools()

console.dir(tools, {
  depth: null
})
```

O retorno apresenta nome, descrição e JSON Schema dos argumentos. O cliente
não precisou importar `find_guest`.

## Executar a tool

```typescript
const toolResult = await client.callTool({
  name: 'find_guest',
  arguments: {
    name: 'João'
  }
})
```

## Demonstrar erro de protocolo sem interromper a aula

```typescript
try {
  await client.callTool({
    name: 'tool_inexistente',
    arguments: {}
  })
} catch (error) {
  console.error('Erro esperado:', error)
}
```

Sem o `try/catch`, a execução terminaria antes de demonstrar os resources.

## Descobrir e ler resources

```typescript
const { resources } =
  await client.listResources()

const resourceResult =
  await client.readResource({
    uri: 'parnaioca://bedrooms/catalog'
  })
```

## Encerrar a conexão

```typescript
try {
  // demonstrações
} finally {
  await client.close()
}
```

O `finally` garante que o processo filho seja encerrado mesmo quando ocorre um
erro.

## Executar

```bash
npm run mcp:client
```

## Resultado esperado

```text
Conectando ao servidor MCP...
Servidor MCP da Parnaioca iniciado

TOOLS DISPONÍVEIS
find_guest

EXECUTANDO find_guest
João Silva

EXECUTANDO TOOL INEXISTENTE
Erro esperado: Tool tool_inexistente not found

RESOURCES DISPONÍVEIS
bedrooms-catalog

LENDO CATÁLOGO DE QUARTOS
...

Conexão encerrada
```

## Perguntas para a turma

1. Quem iniciou o processo do servidor?
2. O cliente conhecia previamente a estrutura dos argumentos de
   `find_guest`?
3. Quem validou que `tool_inexistente` não existia?
4. `readResource` pede ao modelo que escolha um resource?
5. Onde os dados de hóspedes continuam armazenados?

## Respostas esperadas

- `StdioClientTransport` iniciou o servidor como processo filho.
- A estrutura foi descoberta por `listTools()`.
- O servidor/protocolo rejeitou a ferramenta desconhecida.
- Nesse exemplo, foi o nosso código que escolheu explicitamente a URI.
- Os dados continuam nos JSONs da aplicação; MCP apenas fornece uma interface.

---

# Bloco 6 - Integrar MCP ao agente

**Tempo:** 25 minutos  
**Formato:** [CONSTRUIR]

Até aqui não existe IA no fluxo MCP. Foi o script que decidiu executar
`find_guest`.

Agora, o host conectará as duas partes:

```text
Usuário
  ↓
Responses API
  ↓ solicita function_call
Host do agente
  ↓ client.callTool
Servidor MCP
  ↓ resultado
Host do agente
  ↓ function_call_output
Responses API
  ↓
Resposta final
```

Crie `src/mcp/agent.ts`.

## Criar os dois clientes

O arquivo possui dois clientes com responsabilidades diferentes:

```typescript
const openai = new OpenAI({ apiKey })

const mcpClient = new Client({
  name: 'parnaioca-agent',
  version: '1.0.0'
})
```

- `openai`: envia inputs e recebe decisões do modelo;
- `mcpClient`: descobre e executa capacidades MCP.

## Converter a definição MCP

```typescript
function toOpenAITool(
  tool: McpTool
): OpenAI.Responses.FunctionTool {
  return {
    type: 'function',
    name: tool.name,
    description:
      tool.description ?? 'Ferramenta fornecida pelo servidor MCP',
    parameters: tool.inputSchema,
    strict: false
  }
}
```

MCP fornece nome, descrição e schema. A Responses API precisa receber essas
informações como uma function tool.

Use `strict: false` porque o schema veio de um servidor externo e não estamos
garantindo que ele siga todas as exigências do modo estrito da OpenAI.

## Descobrir dinamicamente

```typescript
await mcpClient.connect(transport)

const { tools: mcpTools } =
  await mcpClient.listTools()

const tools = mcpTools.map(toOpenAITool)
```

Esse é o ganho central: o host não escreve manualmente a definição de
`find_guest`.

## Deixar o modelo escolher

```typescript
const response = await openai.responses.create({
  model,
  instructions: `
    Você é o assistente da Pousada Parnaioca.
    Use as ferramentas disponíveis quando precisar
    consultar dados da pousada.
    Não invente informações.
  `,
  input,
  tools
})
```

O modelo pode devolver um `function_call`, mas ele não sabe que existe
`stdio`, processo filho ou `callTool()`.

## Encaminhar a solicitação ao MCP

```typescript
const result = await mcpClient.callTool({
  name: toolCall.name,
  arguments: JSON.parse(
    toolCall.arguments
  ) as Record<string, unknown>
})
```

Aqui o host atua como ponte. O nome e os argumentos vieram do modelo, mas a
execução ocorreu no servidor MCP.

## Devolver o resultado ao modelo

```typescript
input.push({
  type: 'function_call_output',
  call_id: toolCall.call_id,
  output: JSON.stringify(result)
})
```

`call_id` associa o resultado à solicitação original do modelo.

O agent loop continua necessário porque a primeira resposta solicita a
ferramenta e a segunda produz o texto final.

## Executar

```bash
npm run mcp:agent
```

## Resultado validado

```text
RODADA 1
MCP TOOL CALL { name: 'find_guest', arguments: '{"name":"João"}' }
MCP TOOL RESULT { ... }

RODADA 2

RESPOSTA FINAL
Sim. João Silva está cadastrado, e o e-mail dele é
joao.silva@example.com.
```

## Perguntas para a turma

1. Quem escolheu `find_guest`?
2. Quem executou `find_guest`?
3. O modelo teve acesso direto ao JSON de hóspedes?
4. Para que serve `listTools()`?
5. Para que serve `callTool()`?
6. Por que aconteceram duas rodadas?
7. O que `call_id` associa?
8. Se uma nova tool for registrada no servidor, onde a descrição dela será
   escrita no agente?

## Respostas esperadas

- O modelo escolheu entre as tools apresentadas.
- O servidor MCP executou a regra de negócio.
- O modelo recebeu apenas o resultado devolvido pelo host.
- `listTools()` descobre capacidades e schemas.
- `callTool()` solicita ao servidor a execução.
- Uma rodada solicitou a ferramenta; outra redigiu a resposta.
- `call_id` liga o output à chamada solicitada.
- O agente descobre a nova definição dinamicamente.

---

# Bloco 7 - O mesmo MCP por Streamable HTTP

**Tempo:** 15 minutos  
**Formato:** [DEMONSTRAR]

O objetivo deste bloco não é ensinar deploy. É provar que as mesmas
capacidades podem ser transportadas pela rede.

## Servidor HTTP

Crie `src/mcp/http-server.ts`:

```typescript
import { createMcpExpressApp } from '@modelcontextprotocol/express'
import { toNodeHandler } from '@modelcontextprotocol/node'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { createParnaiocaMcpServer } from './create-server.js'

const port = 8001
const app = createMcpExpressApp()

const mcpHandler = createMcpHandler(
  createParnaiocaMcpServer
)

const nodeHandler = toNodeHandler(mcpHandler)

app.all('/mcp', async (request, response) => {
  await nodeHandler(
    request,
    response,
    request.body
  )
})

app.listen(port, '127.0.0.1', () => {
  console.log(
    `Servidor MCP HTTP iniciado em http://127.0.0.1:${port}/mcp`
  )
})
```

### Por que passar `request.body`?

`createMcpExpressApp()` já instala o parser JSON. Quando a requisição chega
ao adaptador Node, o stream original já foi consumido pelo Express.

Por isso passamos o corpo previamente convertido como terceiro argumento:

```typescript
await nodeHandler(request, response, request.body)
```

Sem isso, o teste realizado durante a preparação retornou:

```text
Parse error: Invalid JSON
```

## Cliente HTTP

Crie `src/mcp/http-client.ts`:

```typescript
import {
  Client,
  StreamableHTTPClientTransport
} from '@modelcontextprotocol/client'

const client = new Client({
  name: 'parnaioca-http-client',
  version: '1.0.0'
})

const transport = new StreamableHTTPClientTransport(
  new URL('http://127.0.0.1:8001/mcp')
)
```

Depois de conectar, `listTools()` e `callTool()` são iguais aos usados com
`stdio`. O transporte mudou, mas o protocolo e as capacidades permaneceram.

## Executar em dois terminais

Terminal 1:

```bash
npm run mcp:http-server
```

Terminal 2:

```bash
npm run mcp:http-client
```

## Resultado esperado

```text
Conectando ao servidor MCP por HTTP...

TOOLS DISPONÍVEIS
find_guest

RESULTADO DE find_guest
João Silva

Conexão HTTP encerrada
```

## Comparativo

| Aspecto | `stdio` | Streamable HTTP |
| --- | --- | --- |
| Servidor iniciado pelo cliente | Normalmente sim | Normalmente não |
| Mesmo computador | Normalmente sim | Não é obrigatório |
| Endpoint de rede | Não | Sim |
| Publicável online | Não diretamente | Sim |
| Precisa pensar em autenticação de rede | Menos frequente | Obrigatoriamente |
| Tools e resources mudam | Não | Não |

---

# Bloco 8 - Localhost não significa internet

**Tempo:** 10 minutos  
**Formato:** [EXPLICAR]

O endpoint usado na demonstração é:

```text
http://127.0.0.1:8001/mcp
```

Ele usa HTTP, mas somente programas executados na própria máquina conseguem
acessá-lo.

Depois de publicar o serviço, a URL poderia ser:

```text
https://mcp.parnaioca.com/mcp
```

Para isso, a aplicação Node seria implantada em um servidor comum. Não é
necessário trocar as tools ou resources.

## Requisitos mínimos para exposição online

- HTTPS;
- autenticação dos clientes;
- autorização por tool e resource;
- validação de host e origem;
- proteção contra DNS rebinding;
- rate limiting;
- logs e auditoria;
- isolamento entre usuários ou empresas;
- gerenciamento seguro de credenciais.

Não apresente um bearer token fixo como solução de produção. Ele pode
ser usado em uma demonstração para visualizar o cabeçalho, mas servidores MCP
remotos reais devem adotar um fluxo de identidade e autorização adequado.

## MCP remoto e OpenAI

Um serviço hospedado pela OpenAI não consegue acessar o `localhost` do aluno.
Para que a plataforma se conecte diretamente a um servidor MCP remoto, ele
precisa estar disponível em uma URL alcançável pela internet e devidamente
protegida.

Nesta aula, nossa aplicação Node continua sendo o host e usa o cliente MCP.
Isso permite estudar todo o fluxo sem adicionar deploy, DNS ou conta em um
provedor de nuvem.

---

# Bloco 9 - Onde entram frameworks de agentes

**Tempo:** 5 minutos  
**Formato:** [EXPLICAR]

O curso construiu o loop manualmente para tornar visíveis:

- mensagens enviadas ao modelo;
- escolhas de ferramentas;
- execução das tools;
- associação por `call_id`;
- limites de rodadas;
- memória;
- permissões;
- aprovação humana;
- RAG;
- MCP.

Frameworks podem fornecer abstrações para parte desse trabalho, como loops,
tracing, handoffs, memória e integração de ferramentas. Eles não eliminam a
necessidade de entender segurança, schemas, estado e efeitos das ferramentas.

Para preservar o tempo da turma, mostre apenas um exemplo montado ou a
arquitetura. Não migre todo o projeto para outro framework durante a aula.

---

# Bloco 10 - Demonstração final com OpenAI Agents SDK

**Tempo:** 10 minutos  
**Formato:** [DEMONSTRAR]

Este é o último conteúdo da aula. O arquivo deve estar pronto antes da
explicação. Os alunos não precisam digitá-lo junto com o professor.

O objetivo é mostrar que existem frameworks com boa parte da infraestrutura
de agentes pronta. Não substitua o código manual do curso: coloque as duas
implementações lado a lado.

## Framework de agentes

Um framework de agentes é uma camada acima do cliente da API. Ele organiza
componentes recorrentes de aplicações agentic, como:

- agent loop;
- execução e retorno de tools;
- integração com MCP;
- sessões;
- guardrails;
- aprovação humana;
- handoffs entre agentes;
- tracing.

Compare:

```text
Pacote openai
  └─ cliente da API
       └─ nossa aplicação implementa o agent loop

Pacote @openai/agents
  └─ abstrações de Agent e Runner
       └─ o framework implementa o agent loop
```

## Arquivo deixado para estudo

O exemplo está em:

```text
src/frameworks/agents-sdk.ts
```

Instalação utilizada:

```bash
npm install @openai/agents
```

## Código da demonstração

```typescript
import 'dotenv/config'
import {
  Agent,
  MCPServerStdio,
  run
} from '@openai/agents'

const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

const mcpServer = new MCPServerStdio({
  name: 'Parnaioca MCP',
  command: 'npx',
  args: [
    'tsx',
    'src/mcp/server.ts'
  ],
  cacheToolsList: true
})

try {
  await mcpServer.connect()

  const agent = new Agent({
    name: 'Assistente Parnaioca',
    instructions: `
      Você é o assistente da Pousada Parnaioca.

      Use as ferramentas disponíveis quando precisar
      consultar os dados da pousada.

      Não invente informações.
    `,
    model,
    mcpServers: [
      mcpServer
    ]
  })

  const result = await run(
    agent,
    'O João está cadastrado? Qual é o e-mail dele?'
  )

  console.log('RESPOSTA FINAL')
  console.log(result.finalOutput)
} finally {
  await mcpServer.close()
}
```

## Executar

```bash
npm run framework:agents
```

## Como apresentar em dez minutos

1. Abra `src/mcp/agent.ts`, que possui nossa implementação manual.
2. Relembre `listTools()`, conversão dos schemas, o `for` das rodadas,
   `callTool()` e `function_call_output`.
3. Abra `src/frameworks/agents-sdk.ts` ao lado.
4. Mostre que `Agent` recebe instruções, modelo e servidores MCP.
5. Mostre que `run()` substitui nosso agent loop explícito.
6. Execute a mesma pergunta e compare a resposta.
7. Encerre explicando que o mecanismo continua existindo, mas foi encapsulado.

## O que o Agents SDK fez por nós

- conectou as tools MCP ao agente;
- descobriu as tools do servidor;
- apresentou os schemas ao modelo;
- recebeu a solicitação de tool;
- executou a tool MCP;
- devolveu o resultado ao modelo;
- repetiu o loop até obter a resposta final.

O `cacheToolsList: true` evita repetir a descoberta das tools durante os runs
dessa demonstração. Ele só deve ser usado enquanto a lista de tools for
estável.

## O que o framework não resolve automaticamente

- autenticação da aplicação;
- autorização das operações;
- regras de negócio;
- segurança do servidor MCP;
- qualidade dos dados;
- veracidade das respostas;
- controle de custos.

Guardrails ajudam a validar o fluxo, mas não substituem a autorização.

## Recursos que devem ser somente citados

- **Handoffs:** transferem a conversa para um agente especialista.
- **Sessions:** ajudam a manter o contexto entre execuções.
- **Human in the loop:** interrompe o run para aprovação.
- **Guardrails:** validam inputs, outputs e chamadas de tools.
- **Tracing:** registra as etapas internas do run para inspeção.

Não implemente esses recursos nesta aula. O projeto manual já demonstrou os
conceitos centrais sem esconder o funcionamento.

## Perguntas rápidas para a turma

1. O framework eliminou o agent loop ou apenas o encapsulou?
2. Quem continua executando `find_guest`?
3. O framework tornou a tool automaticamente autorizada?
4. Por que foi importante construir o loop manualmente antes?

## Respostas esperadas

- O loop foi encapsulado dentro de `run()`.
- O servidor MCP continua executando `find_guest`.
- Permissões ainda precisam ser aplicadas pelo sistema.
- Agora os alunos sabem o que o framework está abstraindo e conseguem depurar
  o fluxo com mais consciência.

## Frase de encerramento

> Framework não remove a complexidade do sistema; ele oferece abstrações
> prontas para a complexidade que se repete.

---

# Bloco 11 - Exemplo montado de integração com API

**Tempo:** 5 minutos  
**Formato:** [DEMONSTRAR]

Este exemplo existe para tornar explícito o item **integração com APIs** da
ementa. Os alunos não precisam escrevê-lo durante a aula.

Até agora, as tools acessaram os arrays importados diretamente. Em uma
aplicação real, a implementação da tool também pode chamar uma API externa.

O exemplo está em:

```text
src/examples/api-tools.ts
```

## Função usada como corpo de uma tool

```typescript
async function listBedroomsFromApi(): Promise<Bedroom[]> {
  console.log('TOOL listBedroomsFromApi EXECUTADA')

  const response = await fetch(
    'http://localhost:8000/bedrooms'
  )

  if (!response.ok) {
    throw new Error(
      `A API respondeu com HTTP ${response.status}`
    )
  }

  const body = await response.json() as BedroomsResponse

  return body.data
}
```

A função foi executada diretamente para que a demonstração não consuma
outra chamada ao modelo. Ela poderia ser associada a uma function tool ou
registrada como uma tool MCP sem mudar o acesso HTTP.

## Executar

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run example:api
```

## Fluxo

```text
Tool JavaScript
  -> fetch("http://localhost:8000/bedrooms")
  -> rota Express
  -> dados JSON
  -> resposta HTTP
  -> resultado da tool
```

Neste exemplo, cliente e API estão na mesma máquina. A URL poderia apontar
para qualquer API autorizada e acessível pela aplicação.

## Pontos para explicar

- O modelo não executa `fetch()`.
- A tool controla a URL, o método e os dados enviados.
- O status HTTP deve ser validado.
- Autenticação da API deve ficar na aplicação, não no prompt.
- A resposta da API ainda precisa ser validada antes de ser confiada.
- Uma API externa pode falhar, demorar ou limitar requisições.

## Perguntas para a turma

1. O modelo conhece a URL da API obrigatoriamente?
2. Onde deveria ficar um token de acesso da API?
3. Um HTTP `200` garante que o formato recebido está correto?
4. Quem decide quais campos da resposta chegam ao modelo?

## Respostas esperadas

- A tool pode esconder completamente a URL e os detalhes do serviço.
- A credencial pertence ao ambiente seguro da aplicação.
- O corpo ainda precisa ser validado.
- A aplicação pode filtrar o resultado antes de devolvê-lo ao agente.

---

# Bloco 12 - Exemplo montado de integração com banco

**Tempo:** 5 minutos  
**Formato:** [DEMONSTRAR]

Este exemplo torna explícito o item **integração com banco de dados** sem
introduzir setup de Docker, servidor, ORM ou migrations.

O exemplo usa o SQLite incluído no Node.js 24:

```typescript
import { DatabaseSync } from 'node:sqlite'

const database = new DatabaseSync(':memory:')
```

`':memory:'` significa que o banco existe apenas na memória do processo. Ele
é descartado quando o script termina.

O arquivo completo está em:

```text
src/examples/database-tools.ts
```

## O que o arquivo faz

1. Cria as tabelas `guests`, `bedrooms` e `reservations`.
2. Popula as tabelas usando os mesmos JSONs do projeto.
3. Prepara uma consulta SQL com `JOIN`.
4. Busca João e suas reservas.
5. Fecha o banco ao terminar.

## Função usada como corpo de uma tool

```typescript
function findGuestReservationsInDatabase(
  name: string
) {
  const statement = database.prepare(`
    SELECT
      guests.name AS guest,
      guests.email,
      reservations.id AS reservation,
      bedrooms.name AS bedroom,
      reservations.checkin_at AS checkinAt,
      reservations.checkout_at AS checkoutAt,
      reservations.status
    FROM guests
    LEFT JOIN reservations
      ON reservations.guest_id = guests.id
    LEFT JOIN bedrooms
      ON bedrooms.id = reservations.bedroom_id
    WHERE LOWER(guests.name) LIKE LOWER(?)
    ORDER BY reservations.checkin_at
  `)

  return statement.all(`%${name}%`)
}
```

O valor pesquisado é enviado como parâmetro `?`. Não monte SQL concatenando
diretamente argumentos produzidos pelo modelo.

## Executar

```bash
npm run example:database
```

## Fluxo

```text
Tool JavaScript
  -> consulta SQL parametrizada
  -> SQLite em memória
  -> linhas da consulta
  -> resultado da tool
```

## Onde entraria um banco real

Em produção, a função poderia usar PostgreSQL, MySQL, SQL Server, MongoDB
ou outro serviço. A mudança principal estaria na camada que consulta os dados:

```text
findGuestReservationsInDatabase
  -> driver ou ORM
  -> conexão configurada
  -> banco persistente
```

O contrato oferecido ao agente pode permanecer igual mesmo quando a fonte dos
dados muda.

## Banco operacional e banco vetorial

Reforce a diferença:

```text
SQLite/PostgreSQL operacional
  -> hóspedes, reservas e quartos

Vector Store
  -> chunks, embeddings e documentos
```

Uma aplicação real pode utilizar os dois.

## Perguntas para a turma

1. O banco em memória preserva dados depois que o script termina?
2. O modelo recebe acesso livre para escrever SQL?
3. Por que a consulta usa `?`?
4. Trocar SQLite por PostgreSQL obrigaria mudar a descrição da tool?

## Respostas esperadas

- Não; este banco é recriado em cada execução.
- Não; a aplicação oferece operações controladas.
- O placeholder permite separar o comando SQL do valor recebido.
- O contrato pode permanecer, mesmo que a implementação seja substituída.

---

# Bloco 13 - Chatbot, workflow e agente

**Tempo:** 3 minutos  
**Formato:** [EXPLICAR]

| Tipo | Característica principal | Exemplo na pousada |
| --- | --- | --- |
| Chatbot | Mantém uma conversa e produz respostas | Responder uma pergunta geral |
| Workflow | Executa uma sequência previamente definida | Sempre consultar reserva e depois enviar e-mail |
| Agente | Decide dinamicamente quais passos e tools usar | Decidir entre dados, RAG ou nenhuma ferramenta |

Um chatbot pode possuir tools e um agente pode conversar. Os nomes descrevem
principalmente a arquitetura e o grau de decisão, não apenas a interface de
chat.

---

# Bloco 14 - Consolidação da arquitetura do curso

**Tempo:** 2 minutos  
**Formato:** [EXPLICAR]

Use este diagrama para fechar todo o curso:

```text
Usuário
  -> API Express
      -> validação com Zod
      -> autenticação e autorização
      -> histórico e estado em memória
      -> agent loop
          -> Responses API / LLM
          -> function tools
              -> arrays JSON
              -> API REST
              -> banco operacional
          -> file_search
              -> vector stores
              -> chunks e embeddings
          -> MCP Client
              -> MCP Server
                  -> tools e resources
          -> aprovação humana
      -> resposta para o usuário
```

O OpenAI Agents SDK apresentado no bloco anterior pode encapsular parte do
agent loop e das integrações, mas as regras de negócio, permissões e fontes de
dados continuam sendo responsabilidade da aplicação.

---

# Roteiro de testes da Aula 7

## 1. Validar TypeScript

```bash
npm run typecheck
```

## 2. Testar servidor e cliente `stdio`

```bash
npm run mcp:client
```

Confirmar:

- servidor iniciado como processo filho;
- `find_guest` aparece em `listTools()`;
- João é encontrado;
- tool inexistente produz erro controlado;
- `bedrooms-catalog` aparece em `listResources()`;
- o resource devolve o catálogo.

## 3. Testar o agente com MCP

```bash
npm run mcp:agent
```

Confirmar:

- rodada 1 produz `find_guest`;
- o host executa `mcpClient.callTool()`;
- rodada 2 produz a resposta final;
- a resposta usa somente o resultado da tool.

## 4. Testar Streamable HTTP

Terminal 1:

```bash
npm run mcp:http-server
```

Terminal 2:

```bash
npm run mcp:http-client
```

Confirmar:

- conexão em `http://127.0.0.1:8001/mcp`;
- descoberta da mesma tool;
- mesmo resultado para João;
- encerramento limpo do cliente.

## 5. Validar build

```bash
npm run build
```

## 6. Demonstrar o framework

```bash
npm run framework:agents
```

Confirmar:

- o servidor MCP é iniciado;
- o Agents SDK encontra `find_guest`;
- a resposta informa o cadastro e o e-mail de João;
- não existe agent loop explícito no arquivo da demonstração.

## 7. Demonstrar integração com API

Com a API executando em outro terminal:

```bash
npm run example:api
```

Confirmar:

- `fetch()` consulta `GET /bedrooms`;
- o status HTTP é verificado;
- os quartos são exibidos sem acesso direto aos arrays pelo exemplo.

## 8. Demonstrar integração com banco

```bash
npm run example:database
```

Confirmar:

- SQLite foi criado somente em memória;
- os JSONs foram usados para popular as tabelas;
- a consulta usa parâmetro;
- o `JOIN` devolve hóspede, reserva e quarto;
- nenhum servidor ou Docker foi instalado.

---

# Erros comuns

## `Tool ... not found`

O cliente chamou uma tool que não foi registrada. Use `listTools()` para
inspecionar os nomes anunciados.

## O cliente para antes de listar resources

Uma chamada proposital a uma tool inexistente ficou fora de um `try/catch`.
Trate o erro esperado para continuar a demonstração.

## Texto de log quebra o servidor `stdio`

Logs do servidor foram enviados para `stdout`. Durante essa demonstração,
use `console.error` no processo MCP servido por `stdio`.

## `Parse error: Invalid JSON` no HTTP

O Express já consumiu o corpo. Passe `request.body` como terceiro argumento
de `nodeHandler`.

## `ECONNREFUSED` no cliente HTTP

O servidor HTTP não foi iniciado, foi encerrado ou está em outra porta.

## A URL funciona localmente, mas não na OpenAI

`127.0.0.1` e `localhost` apontam para a máquina de quem executa o cliente.
Eles não são endereços públicos.

---

# Fechamento da aula

Escreva no quadro:

```text
MCP padroniza como capacidades são descobertas e utilizadas.
Ele não decide permissões e não executa o agent loop por nós.
```

Peça aos alunos que descrevam o fluxo completo sem olhar o código:

1. O cliente conecta ao servidor MCP.
2. O cliente descobre as tools.
3. O host converte as definições para a Responses API.
4. O modelo solicita uma tool.
5. O host encaminha a solicitação ao servidor MCP.
6. O servidor executa e devolve o resultado.
7. O host devolve o resultado ao modelo.
8. O modelo produz a resposta final.

## Pergunta final

> Se o servidor MCP estiver hospedado em outra empresa, quem continua sendo
> responsável por decidir se o usuário pode executar uma ferramenta sensível?

Resposta esperada: tanto o host deve limitar o que oferece ao modelo quanto o
servidor deve validar a identidade e a permissão antes da execução. Não se
deve confiar apenas no prompt ou no cliente.

## Checklist do professor

- [ ] Explicou host, cliente, servidor e transport.
- [ ] Diferenciou tool de resource.
- [ ] Executou o cliente `stdio`.
- [ ] Mostrou descoberta por `listTools()` e `listResources()`.
- [ ] Executou o agente usando uma tool MCP.
- [ ] Explicou quem escolhe e quem executa a tool.
- [ ] Demonstrou Streamable HTTP.
- [ ] Diferenciou HTTP local de servidor publicado online.
- [ ] Explicou os requisitos de segurança para produção.
- [ ] Citou o papel dos frameworks sem iniciar uma migração longa.
- [ ] Executou rapidamente o exemplo do OpenAI Agents SDK.
- [ ] Demonstrou uma tool consumindo a API REST.
- [ ] Demonstrou uma tool consultando SQLite em memória.
- [ ] Diferenciou chatbot, workflow e agente.
- [ ] Encerrou com o diagrama da arquitetura completa.

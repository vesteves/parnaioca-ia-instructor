# Guia de testes - Aula 3

Este documento organiza a demonstração da Aula 3, **De LLM para Agent**. Ele pertence ao repositório do professor e não deve ser incluído no corpus de documentos da pousada.

## Objetivos da aula

Ao final da aula, o aluno deverá compreender que:

- o modelo não executa funções JavaScript diretamente;
- o modelo solicita uma chamada de ferramenta;
- a aplicação decide se e como executar a ferramenta;
- o `call_id` associa a chamada ao resultado correspondente;
- um agent loop pode precisar de várias rodadas antes da resposta final;
- limites de rodadas e ferramentas evitam execução indefinida;
- decisão do modelo e autorização da aplicação são responsabilidades diferentes.

## Preparação

Parta da tag:

```bash
git switch --detach aula-03-inicio
```

Para voltar ao desenvolvimento normal:

```bash
git switch main
```

Confira o arquivo `.env`:

```dotenv
OPENAI_API_KEY=sua-chave
OPENAI_MODEL=gpt-5.6-luna
```

Instale as dependências e valide o projeto:

```bash
npm install
npm run typecheck
```

---

# Parte 1 - O modelo solicita, mas não executa

## Pergunta

```text
O hóspede João possui cadastro? Se sim, qual é o e-mail dele?
```

Faça uma única chamada a `responses.create()` com a ferramenta `findGuest` e exiba:

```typescript
console.dir(response.output, {
  depth: null
})
```

## Resultado esperado

O retorno deverá conter um item semelhante a:

```text
type: function_call
name: findGuest
arguments: {"name":"João"}
call_id: call_...
```

O log abaixo ainda não deve aparecer:

```text
FUNÇÃO findGuest EXECUTADA
```

## Pontos para discussão

- `function_call` é uma solicitação produzida pelo modelo.
- O modelo conhece somente a descrição e o schema da ferramenta.
- A função JavaScript ainda não foi executada.
- `call_id` identifica uma chamada específica de ferramenta.
- Ter uma definição em `tools` não concede execução automática ao modelo.

---

# Parte 2 - Executar a ferramenta e devolver o resultado

Percorra `response.output`, localize o item `function_call`, execute `findGuest` e acrescente ao contexto:

```typescript
input.push({
  type: 'function_call_output',
  call_id: item.call_id,
  output: JSON.stringify(guest ?? null)
})
```

Faça uma segunda chamada a `responses.create()`.

## Resultado esperado

```text
FUNÇÃO findGuest EXECUTADA
RESPOSTA FINAL
Sim. O hóspede João Silva possui cadastro...
```

## Pontos para discussão

- A aplicação executa `findGuest`.
- O resultado vem dos JSONs da aplicação, não do treinamento do modelo.
- A segunda requisição permite que o modelo interprete o resultado da função.
- O mesmo `call_id` liga `function_call` a `function_call_output`.
- O item `function_call_output` é acrescentado a `input`, não a `response.output`.

## Observação sobre a tipagem

Com `exactOptionalPropertyTypes: true`, não use indiscriminadamente:

```typescript
input.push(...response.output)
```

`response.output` possui uma união ampla com itens que não são aceitos como entrada. Preserve apenas os tipos compatíveis depois do narrowing:

```typescript
if (item.type === 'reasoning') {
  input.push(item)
}

if (item.type === 'function_call') {
  input.push(item)
}
```

Não desative a tipagem estrita e não use `any` apenas para ocultar essa incompatibilidade.

---

# Parte 3 - Construir o agent loop

Substitua o fluxo fixo de duas chamadas por um `while`. Enquanto a resposta contiver `function_call`, a aplicação deverá:

1. preservar os itens de raciocínio compatíveis;
2. preservar a chamada de ferramenta;
3. executar a função solicitada;
4. acrescentar o `function_call_output` ao contexto;
5. fazer uma nova requisição ao modelo.

Quando não houver `function_call`, use `response.output_text` como resposta final.

## Resultado esperado com uma ferramenta

```text
RODADA 1
FUNÇÃO findGuest EXECUTADA
RODADA 2
RESPOSTA FINAL
```

## Pontos para discussão

- O modelo pode responder diretamente ou solicitar ferramentas.
- A aplicação controla o loop.
- O término acontece quando não existem novas chamadas de função.
- Um agente combina modelo, ferramentas e um ciclo de execução.

---

# Parte 4 - Encadear ferramentas

Adicione `findReservationsByGuestId`, mantendo `findGuest` disponível.

## Pergunta

Use uma data explícita para que o resultado não dependa do dia da aula:

```text
Considerando a data de 6 de setembro de 2026, qual é a próxima reserva de João?
```

## Resultado esperado

```text
RODADA 1
FUNÇÃO findGuest EXECUTADA
RODADA 2
FUNÇÃO findReservationsByGuestId EXECUTADA
RODADA 3
RESPOSTA FINAL
```

A resposta final deverá identificar a reserva com check-in em `2026-10-09`.

## Sequência esperada

```text
findGuest({ name: "João" })
  -> guest-001

findReservationsByGuestId({ guestId: "guest-001" })
  -> reservas de João

resposta final
  -> próxima reserva em 09/10/2026
```

## Pontos para discussão

- O código não determinou previamente a ordem das ferramentas.
- O modelo percebeu que precisava converter um nome em ID.
- O resultado da primeira ferramenta forneceu o argumento da segunda.
- Uma rodada pode conter uma ou várias chamadas de ferramenta.

---

# Parte 5 - Observabilidade

Antes de executar cada ferramenta, registre:

```typescript
console.log('TOOL CALL', {
  name: item.name,
  arguments: JSON.parse(item.arguments)
})
```

Depois da execução, registre:

```typescript
console.log('TOOL RESULT', toolResult)
```

## Resultado esperado

O terminal deverá permitir identificar:

- o número da rodada;
- o nome da ferramenta;
- os argumentos escolhidos pelo modelo;
- a execução da função real;
- o resultado devolvido ao modelo;
- o momento da resposta final.

Observabilidade não altera a decisão do agente. Ela permite explicar e diagnosticar o que aconteceu.

---

# Parte 6 - Executor central de ferramentas

Crie um registro que associe nomes conhecidos pelo modelo às funções da aplicação:

```typescript
const toolHandlers: Record<string, ToolHandler> = {
  findGuest: argumentsData => {
    // validar e executar
  },
  findReservationsByGuestId: argumentsData => {
    // validar e executar
  }
}
```

O `executeTool` deverá:

1. localizar o handler pelo nome;
2. converter os argumentos JSON;
3. validar os campos usados pela função;
4. executar o handler;
5. transformar falhas em um resultado serializável.

## Pontos para discussão

- O modelo não conhece `toolHandlers`.
- A definição de `tools` informa capacidades ao modelo.
- `toolHandlers` controla quais implementações a aplicação realmente possui.
- Uma ferramenta anunciada sem handler deve produzir erro controlado.
- O resultado de erro também pode ser enviado ao modelo para que ele decida como responder.

---

# Parte 7 - Limites do agente

Use limites independentes:

```typescript
const MAX_ROUNDS = 5
const MAX_TOOL_CALLS = 10
```

- `MAX_ROUNDS` limita quantas requisições o agent loop envia ao modelo.
- `MAX_TOOL_CALLS` limita quantas funções locais podem ser executadas.
- Uma única rodada pode conter várias chamadas de ferramenta.

## Teste proposital do limite

Altere temporariamente:

```typescript
const MAX_ROUNDS = 2
```

Repita a pergunta sobre a próxima reserva de João.

## Resultado esperado

```text
RODADA 1
FUNÇÃO findGuest EXECUTADA
RODADA 2
FUNÇÃO findReservationsByGuestId EXECUTADA
Error: O agente não terminou após 2 rodadas
```

A segunda ferramenta é executada, mas a terceira requisição, que geraria a resposta final, não acontece.

Restaure ao terminar:

```typescript
const MAX_ROUNDS = 5
```

## Pontos para discussão

- Sem limites, um agente pode consumir requisições, tokens e tempo indefinidamente.
- Atingir o limite não significa que os dados procurados não existem.
- O erro operacional não deve ser apresentado como uma resposta factual do modelo.

---

# Parte 8 - Função reutilizável e rota HTTP

Extraia o fluxo para:

```typescript
export async function runAgent(
  question: string
): Promise<string> {
  // contexto, contadores e agent loop
}
```

Mantenha `input`, `round` e `toolCalls` dentro da função para que cada execução possua estado independente.

Remova chamadas de demonstração do final de `tool-calling.ts`. Caso contrário, elas serão executadas quando o módulo for importado pelo servidor.

Use `runAgent` no `POST /chat`:

```typescript
const answer = await runAgent(
  res.locals.validation.message
)
```

## Testes finais pela API

Inicie o servidor:

```bash
npm run dev
```

### Resposta sem ferramenta

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explique resumidamente o que é uma reserva de hospedagem."}'
```

Esperado:

```text
1 rodada
0 ferramentas
```

### Uma ferramenta

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"João possui cadastro? Se sim, qual é o e-mail dele?"}'
```

Esperado:

```text
2 rodadas
findGuest
```

### Ferramentas encadeadas

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Considerando 6 de setembro de 2026, qual é a próxima reserva de João?"}'
```

Esperado:

```text
3 rodadas
findGuest
findReservationsByGuestId
```

A resposta HTTP deverá manter o contrato:

```json
{
  "message": "Resposta gerada com sucesso",
  "data": "Resposta final produzida pelo agente"
}
```

## Atenção sobre segurança

Neste projeto didático, hóspedes e reservas são fictícios. Mesmo assim, a rota demonstra um risco real: uma ferramenta pode alcançar dados que não deveriam ser públicos.

Não confie apenas em instruções dadas ao modelo para proteger informações. A aplicação deverá autorizar a execução de ferramentas sensíveis. Esse assunto será desenvolvido na Aula 4 a partir da regra:

```text
Decisão do modelo != autorização da aplicação
```

---

# Checklist de encerramento

- [ ] `npm run typecheck` termina sem erros.
- [ ] `npm run build` termina sem erros.
- [ ] Pergunta geral termina sem ferramenta.
- [ ] Consulta de hóspede executa `findGuest`.
- [ ] Consulta de reserva encadeia duas ferramentas.
- [ ] `call_id` é preservado em cada resultado.
- [ ] Logs mostram rodada, argumentos e resultados.
- [ ] Limite de duas rodadas falha conforme esperado.
- [ ] `MAX_ROUNDS` foi restaurado para `5`.
- [ ] `POST /chat` usa `runAgent`.
- [ ] Importar `tool-calling.ts` não dispara uma pergunta de demonstração.

## Síntese para os alunos

```text
LLM
  decide se precisa de uma ferramenta

Aplicação
  valida, autoriza e executa a ferramenta

Agent loop
  devolve resultados e repete o processo até a resposta final
```

O principal aprendizado da aula é que a autonomia do agente é limitada pelas capacidades e pelos controles implementados pela aplicação.

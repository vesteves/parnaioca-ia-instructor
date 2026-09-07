# Parnaioca IA

Projeto inicial do curso **Agentes de IA com JavaScript**, da COTI Informática.

A aplicação disponibiliza os dados da Pousada Parnaioca e integra um modelo de linguagem para conversação e análise estruturada de avaliações. Os arquivos JSON em `src/data` representam provisoriamente o banco de dados já populado.

## Requisitos

- Node.js 24 ou superior
- npm

## Instalação

```bash
npm install
```

Copie o arquivo de exemplo e configure sua chave:

```bash
cp .env.example .env
```

```dotenv
OPENAI_API_KEY=sua-chave
OPENAI_MODEL=gpt-5.6-luna
```

O arquivo `.env` é local e não deve ser versionado.

## Executando o projeto

Durante o desenvolvimento:

```bash
npm run dev
```

Execução simples:

```bash
npm start
```

Por padrão, o servidor fica disponível em `http://localhost:8000`. Para usar outra porta:

```bash
PORT=3000 npm start
```

## Rotas

```http
GET /health
GET /guests
GET /bedrooms
GET /reservations
POST /chat
POST /reviews/analyze
```

Exemplos com `curl`:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/guests
curl http://localhost:8000/bedrooms
curl http://localhost:8000/reservations
```

Para enviar uma mensagem ao modelo:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explique em uma frase o que é um LLM."}'
```

Para analisar uma avaliação com saída estruturada:

```bash
curl -X POST http://localhost:8000/reviews/analyze \
  -H "Content-Type: application/json" \
  -d '{"review":"O quarto estava limpo e a equipe foi excelente."}'
```

As reservas são armazenadas com `guestId` e `bedroomId`. Na resposta de `GET /reservations`, esses relacionamentos são populados com os dados completos do hóspede e do quarto.

O arquivo `src/first-call.ts` preserva os experimentos da Aula 1 sobre contexto, tokens e ausência de memória entre requisições. Execute-o com:

```bash
npx tsx src/first-call.ts
```

## Comandos

```bash
npm run typecheck
npm run build
npm run prod
```

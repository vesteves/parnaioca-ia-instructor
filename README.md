# Parnaioca IA

Projeto inicial do curso **Agentes de IA com JavaScript**, da COTI Informática.

Neste checkpoint, a aplicação é apenas uma API para consultar os dados da Pousada Parnaioca. Os arquivos JSON em `src/data` representam provisoriamente o banco de dados já populado.

## Requisitos

- Node.js 24 ou superior
- npm

## Instalação

```bash
npm install
```

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
```

Exemplos com `curl`:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/guests
curl http://localhost:8000/bedrooms
curl http://localhost:8000/reservations
```

As reservas são armazenadas com `guestId` e `bedroomId`. Na resposta de `GET /reservations`, esses relacionamentos são populados com os dados completos do hóspede e do quarto.

## Comandos

```bash
npm run typecheck
npm run build
npm run prod
```

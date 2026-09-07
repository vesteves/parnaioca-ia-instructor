import express, { Request, Response } from 'express'
import 'dotenv/config'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import {
  validationMiddleware
} from './validation.middleware.js'
import {
  analyzeReviewSchema,
  reviewAnalysisSchema
} from './review.schema.js'
import { chatSchema } from './chat.schema.js'
import { bedrooms, getPopulatedReservations, guests } from './data/index.js'

const app = express()

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const client = new OpenAI({
  apiKey
})

const port = Number(process.env.PORT) || 8000
const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    message: 'Servidor funcionando',
    data: { status: 'ok' }
  })
})

app.get('/guests', (_req: Request, res: Response) => {
  res.json({
    message: 'Hóspedes listados com sucesso',
    data: guests
  })
})

app.get('/bedrooms', (_req: Request, res: Response) => {
  res.json({
    message: 'Quartos listados com sucesso',
    data: bedrooms
  })
})

app.get('/reservations', (_req: Request, res: Response) => {
  res.json({
    message: 'Reservas listadas com sucesso',
    data: getPopulatedReservations()
  })
})

app.post(
  '/chat',
  validationMiddleware(chatSchema),
  async (_req: Request, res: Response) => {
    const response = await client.responses.create({
      model,
      instructions: `
        Você é o assistente virtual da Pousada Parnaioca.

        Responda sempre em português.

        Responda somente a perguntas relacionadas à pousada,
        hospedagem, reservas, quartos e serviços turísticos.

        Quando uma pergunta depender de dados que não foram
        fornecidos no contexto, diga claramente que não possui
        acesso a essa informação.

        Não invente informações sobre hóspedes, reservas,
        quartos, preços, políticas ou serviços.
      `,
      input: res.locals.validation.message
    })

    res.json({
      message: 'Resposta gerada com sucesso',
      data: response.output_text
    })
  })

app.post(
  '/reviews/analyze',
  validationMiddleware(analyzeReviewSchema),
  async (_req: Request, res: Response) => {
    const response = await client.responses.parse({
      model,
      instructions: `
      Você analisa avaliações dos hóspedes da Pousada Parnaioca.

      Quando houver elogios e reclamações na mesma avaliação,
      considere o impacto do problema na experiência do hóspede.

      Quando mais de uma categoria estiver presente,
      escolha aquela relacionada ao problema de maior impacto.
    `,
      input: [
        {
          role: 'user',
          content: 'O quarto estava impecável e a equipe foi muito atenciosa.'
        },
        {
          role: 'assistant',
          content: `{
        "sentiment": "positive",
        "category": "cleanliness",
        "priority": "low"
      }`
        },
        {
          role: 'user',
          content: 'A praia é linda, mas esperei duas horas para conseguir entrar no quarto.'
        },
        {
          role: 'assistant',
          content: `{
        "sentiment": "negative",
        "category": "service",
        "priority": "high"
      }`
        },
        {
          role: 'user',
          content: res.locals.validation.review
        }
      ],
      text: {
        format: zodTextFormat(
          reviewAnalysisSchema,
          'review_analysis'
        )
      }
    })

    if (!response.output_parsed) {
      res.status(422).json({
        message: 'Não foi possível analisar a avaliação',
        data: null
      })

      return
    }

    res.json({
      message: 'Avaliação analisada com sucesso',
      data: response.output_parsed
    })
  })

app.listen(port, () => {
  console.log(`Servidor ON! http://localhost:${port}`)
})

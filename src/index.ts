import express, { Request, Response } from 'express'
import 'dotenv/config'
import OpenAI from 'openai'
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

app.post('/chat', async (req: Request, res: Response) => {
  const response = await client.responses.create({
    model,
    input: req.body.message
  })

  res.json({
    message: 'Resposta gerada com sucesso',
    data: response.output_text
  })
})

app.listen(port, () => {
  console.log(`Servidor ON! http://localhost:${port}`)
})

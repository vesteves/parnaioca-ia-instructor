import 'dotenv/config'
import OpenAI from 'openai'
import { guests, reservations } from './data/index.js'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const client = new OpenAI({
  apiKey
})

const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

function findGuest(name: string) {
  console.log('FUNÇÃO findGuest EXECUTADA')

  return guests.find(guest =>
    guest.name.toLowerCase().includes(name.toLowerCase())
  )
}

function findReservationsByGuestId(guestId: string) {
  console.log('FUNÇÃO findReservationsByGuestId EXECUTADA')

  return reservations.filter(
    reservation => reservation.guestId === guestId
  )
}

type ToolHandler = (
  argumentsData: Record<string, unknown>
) => unknown

const toolHandlers: Record<string, ToolHandler> = {
  findGuest: argumentsData => {
    if (typeof argumentsData.name !== 'string') {
      throw new Error('O argumento name é obrigatório')
    }

    return findGuest(argumentsData.name)
  },

  findReservationsByGuestId: argumentsData => {
    if (typeof argumentsData.guestId !== 'string') {
      throw new Error('O argumento guestId é obrigatório')
    }

    return findReservationsByGuestId(argumentsData.guestId)
  }
}

function executeTool(name: string, argumentsJson: string) {
  try {
    const handler = toolHandlers[name]

    if (!handler) {
      return {
        error: `Ferramenta não encontrada: ${name}`
      }
    }

    const argumentsData = JSON.parse(argumentsJson) as Record<
      string,
      unknown
    >

    return handler(argumentsData)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao executar a ferramenta'
    }
  }
}

const tools: OpenAI.Responses.Tool[] = [
  {
    type: 'function',
    name: 'findGuest',
    description: 'Busca um hóspede cadastrado pelo nome',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome ou parte do nome do hóspede'
        }
      },
      required: ['name'],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: 'function',
    name: 'findReservationsByGuestId',
    description: 'Busca todas as reservas pertencentes a um hóspede pelo ID',
    parameters: {
      type: 'object',
      properties: {
        guestId: {
          type: 'string',
          description: 'ID do hóspede cadastrado'
        }
      },
      required: ['guestId'],
      additionalProperties: false
    },
    strict: true
  }
]

const MAX_ROUNDS = 5
const MAX_TOOL_CALLS = 10

export async function runAgent(question: string): Promise<string> {
  const input: OpenAI.Responses.ResponseInput = [
    {
      role: 'user',
      content: question
    }
  ]

  let round = 0
  let toolCalls = 0

  while (round < MAX_ROUNDS) {
    round++

    console.log(`RODADA ${round}`)

    const response = await client.responses.create({
      model,
      instructions: `
        Você é o assistente da Pousada Parnaioca.

        Use as ferramentas disponíveis quando precisar consultar
        dados da pousada.

        Não invente informações sobre hóspedes ou reservas.
      `,
      input,
      tools
    })

    let hasFunctionCall = false

    for (const item of response.output) {
      if (item.type === 'reasoning') {
        input.push(item)
        continue
      }

      if (item.type !== 'function_call') {
        continue
      }

      hasFunctionCall = true
      toolCalls++

      if (toolCalls > MAX_TOOL_CALLS) {
        throw new Error(
          `Limite de ${MAX_TOOL_CALLS} chamadas de ferramentas excedido`
        )
      }

      input.push(item)

      console.log('TOOL CALL', {
        name: item.name,
        arguments: JSON.parse(item.arguments)
      })

      const toolResult = executeTool(
        item.name,
        item.arguments
      )

      console.log('TOOL RESULT', toolResult)

      input.push({
        type: 'function_call_output',
        call_id: item.call_id,
        output: JSON.stringify(toolResult)
      })
    }

    if (!hasFunctionCall) {
      return response.output_text
    }
  }

  throw new Error(
    `O agente não terminou após ${MAX_ROUNDS} rodadas`
  )
}

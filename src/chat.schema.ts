import { z } from 'zod'

export const chatSchema = z.object({
  message: z.string({
    error: 'O campo message deve ser um texto'
  }).trim().min(1, {
    error: 'O campo message é obrigatório'
  })
})

export type Chat = z.infer<typeof chatSchema>
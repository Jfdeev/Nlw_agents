import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
    app.post('/questions', {
        schema: {
            body: z.object({
                roomId: z.string().uuid(),
                question: z.string().min(1, { message: 'Question is required' }),
                answer: z.string().optional(),
            })
        },
    },
        async (request, reply) => {
            const { roomId, question, answer } = request.body

            const result = await db.insert(schema.questions).values({
                roomId,
                question,
                answer: answer ?? '',
            }).returning()

            const insertQuestion = result[0]

            if (!insertQuestion) {
                throw new Error('Failed to create question')
            }

            return reply.status(201).send({
                questionId: insertQuestion.id
            })
        }
    )
}
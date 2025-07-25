import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { id } from 'zod/v4/locales'

export const getRooms: FastifyPluginAsyncZod = async (app) => {
    app.get('/rooms', async () => {
        const results = await db
        .select({
            id: schema.rooms.id,
            name: schema.rooms.name,
            description: schema.rooms.description,
            createAt: schema.rooms.createAt,
        })
        .from(schema.rooms)
        .orderBy(schema.rooms.createAt)

        return results
    })
}
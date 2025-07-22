import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'

export const getRooms: FastifyPluginAsyncZod = async (app) => {
    app.get('/rooms', async () => {
        const results = await db.select().from(schema.rooms).orderBy(schema.rooms.createAt)

        return results
    })
}
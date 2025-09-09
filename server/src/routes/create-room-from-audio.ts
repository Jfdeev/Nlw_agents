import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { transcribeAudio, generateEmbeddings, generateRoomInfo } from '../services/gemini.ts'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'

export const createRoomFromAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post('/rooms/from-audio', {},
    async (request, reply) => {
      try {
        const audio = await request.file();

        if (!audio) {
          return reply.status(400).send({ error: 'Audio file is required' });
        }
        
        const audioBuffer = await audio.toBuffer();
        const audioBase64 = audioBuffer.toString('base64');
        const mimeType = audio.mimetype;

        const transcription = await transcribeAudio(audioBase64, mimeType);
        
        if (!transcription) {
          return reply.status(500).send({ error: 'Failed to transcribe audio' });
        }

        const roomInfo = await generateRoomInfo(transcription);
        
        if (!roomInfo) {
          return reply.status(500).send({ error: 'Failed to generate room information' });
        }

        const roomResult = await db.insert(schema.rooms).values({
          name: roomInfo.title,
          description: roomInfo.description,
        }).returning();

        const room = roomResult[0];
        
        if (!room) {
          return reply.status(500).send({ error: 'Failed to create room' });
        }

        const embeddings = await generateEmbeddings(transcription);
        
        if (!embeddings) {
          return reply.status(500).send({ error: 'Failed to generate embeddings' });
        }

        const insertResult = await db.insert(schema.audioChunks).values({
          roomId: room.id,
          transcription,
          embeddings,
        }).returning();

        const chunk = insertResult[0];

        if (!chunk) {
          return reply.status(500).send({ error: 'Failed to save audio chunk' });
        }

        return reply.status(201).send({
          room: {
            id: room.id,
            name: room.name,
            description: room.description,
            createdAt: room.createdAt
          },
          chunk: {
            id: chunk.id,
            transcriptionLength: chunk.transcription.length
          }
        });

      } catch (error) {
        return reply.status(500).send({ 
          error: 'Internal server error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  )
}

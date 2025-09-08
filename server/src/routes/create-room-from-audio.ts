import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { transcribeAudio, generateEmbeddings } from '../services/gemini.ts'
import { db, sql as dbSql } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { generateRoomInfo } from '../services/gemini.ts'

export const createRoomFromAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post('/rooms/from-audio', {
    schema: {
        // Não precisamos de schema aqui pois é multipart/form-data --- IGNORE ---
    },
  },
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

        // 2. Gerar título e descrição usando IA
        const roomInfo = await generateRoomInfo(transcription);
        
        if (!roomInfo) {
          return reply.status(500).send({ error: 'Failed to generate room information' });
        }

        // 3. Criar a sala
        const roomResult = await db.insert(schema.rooms).values({
          name: roomInfo.title,
          description: roomInfo.description,
        }).returning();

        const room = roomResult[0];
        
        if (!room) {
          return reply.status(500).send({ error: 'Failed to create room' });
        }

        // 4. Gerar embeddings e criar chunks
        const embeddings = await generateEmbeddings(transcription);
        
        if (!embeddings) {
          return reply.status(500).send({ error: 'Failed to generate embeddings' });
        }

        // 5. Inserir o chunk de áudio
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
          message: 'Room created successfully from audio',
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

import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { transcribeAudio } from '../services/gemini.ts'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
    app.post('/rooms/:roomId/audio', {
        schema: {
            params: z.object({
                roomId: z.string(),
            }),
        },
    },
        async (request, reply) => {
            const { roomId } = request.params

            const audio = await request.file();

            if (!audio) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            const audioBuffer = await audio.toBuffer();
            const audioBase64 = audioBuffer.toString('base64');
            const mimeType = audio.mimetype;

            const transcription = await transcribeAudio(audioBase64, mimeType);

            if (!transcription) {
                return reply.status(500).send({ error: 'Failed to transcribe audio' });
            }

            return { transcription }

            // 2. Gerar vetor semantico (embeddings)
            // 3. Armazenar os vetores no banco de dados
        }
    )
} 
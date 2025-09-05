import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { generateAnswer, generateEmbeddings } from '../services/gemini.ts'
import { and, eq, sql } from 'drizzle-orm'

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
    app.post('/questions', {
        schema: {
            body: z.object({
                roomId: z.string().uuid(),
                question: z.string().min(1, { message: 'Question is required' }),
            })
        },
    },
        async (request, reply) => {
            const { roomId, question } = request.body

            const embeddings = await generateEmbeddings(question);

            if (!embeddings) {
                throw new Error('Failed to generate embeddings');
            }

            const embeddingString = `[${embeddings.join(', ')}]`;

            console.log('🔍 Question embeddings preview:', embeddings.slice(0, 5));
            
            // Verifica se há chunks na sala
            const totalChunks = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.audioChunks)
                .where(eq(schema.audioChunks.roomId, roomId));
            
            console.log(`📊 Total chunks in room: ${totalChunks[0]?.count || 0}`);

            // Sistema de limiar adaptativo
            const thresholds = [0.5, 0.4, 0.3, 0.2];
            let chunks: Array<{ id: any, transcription: string, similarity: number }> = [];
            let usedThreshold;
            
            for (const threshold of thresholds) {
                chunks = await db
                    .select({
                        id: schema.audioChunks.id,
                        transcription: schema.audioChunks.transcription,
                        similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector)`
                    })
                    .from(schema.audioChunks)
                    .where(and(
                        eq(schema.audioChunks.roomId, roomId),
                        sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector) > ${threshold}`
                    ))
                    .orderBy(sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector) DESC`)
                    .limit(5);
                
                if (chunks.length > 0) {
                    usedThreshold = threshold;
                    break;
                }
            }

            console.log(`🎯 Found ${chunks?.length || 0} relevant chunks using threshold: ${usedThreshold}`);

            // Debug: Verifica as similaridades sem filtro para análise
            if (chunks?.length === 0) {
                const allSimilarities = await db
                    .select({
                        similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector)`,
                        transcription: schema.audioChunks.transcription
                    })
                    .from(schema.audioChunks)
                    .where(eq(schema.audioChunks.roomId, roomId))
                    .orderBy(sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector) DESC`)
                    .limit(3);
                
                console.log('🔍 Top similarities without filter:', allSimilarities.map(s => ({ 
                    similarity: s.similarity, 
                    preview: s.transcription.substring(0, 50) + '...' 
                })));
            } else {
                console.log('✅ Found chunks with similarities:', 
                    chunks.map(c => ({ 
                        similarity: c.similarity, 
                        preview: c.transcription.substring(0, 50) + '...' 
                    }))
                );
            }

            let answer: string | null = null;

            if (chunks && chunks.length > 0) {
                const transcriptions = chunks.map(chunk => chunk.transcription);
                console.log('🤖 Generating answer with relevant chunks...');
                
                answer = await generateAnswer(question, transcriptions);

                if (!answer) {
                    throw new Error('Failed to generate answer');
                }
            } else {
                console.log('⚠️ No relevant chunks found, trying fallback approach...');
                
                // Fallback: tenta gerar resposta com os chunks mais recentes da sala
                const fallbackChunks = await db
                    .select({ transcription: schema.audioChunks.transcription })
                    .from(schema.audioChunks)
                    .where(eq(schema.audioChunks.roomId, roomId))
                    .orderBy(sql`created_at DESC`)
                    .limit(3);
                
                if (fallbackChunks.length > 0) {
                    const fallbackTranscriptions = fallbackChunks.map(chunk => chunk.transcription);
                    console.log('🔄 Generating fallback answer with recent chunks...');
                    
                    answer = await generateAnswer(question, fallbackTranscriptions);
                    
                    if (!answer) {
                        throw new Error('Failed to generate fallback answer');
                    }
                } else {
                    console.log('❌ No chunks available in room for fallback');
                    answer = "Desculpe, não há conteúdo de áudio suficiente nesta sala para responder à sua pergunta. Por favor, faça o upload de alguns áudios primeiro.";
                }
            }

            console.log(`📊 Chunks found: ${chunks?.length || 0}`);
            console.log(`💬 Generated answer: ${answer ? 'Yes' : 'No'}`);

            const result = await db.insert(schema.questions).values({
                roomId,
                question,
                answer: answer,
            }).returning();

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
import { fastify } from 'fastify';
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { fastifyMultipart } from '@fastify/multipart'
import {fastifyCors} from '@fastify/cors'
import { sql } from './db/connection.ts'
import { env } from './env.ts';
import { getRooms } from './routes/get-rooms.ts';
import { createRoomRoute } from './routes/create-room.ts';
import { createQuestionRoute } from './routes/create-question.ts';
import { getRoomRoute } from './routes/get-room.ts';
import { getQuestionsByRoomRoute } from './routes/get-questions-by-room.ts'
import { uploadAudioRoute } from './routes/upload-audio.ts';
import { createRoomFromAudioRoute } from './routes/create-room-from-audio.ts';

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
    origin: '*',
})

app.register(fastifyMultipart, {
    limits: {
        fileSize: 100 * 1024 * 1024
    }
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)



app.get('/health', () =>{
    return 'OK'
})

app.register(getRooms);
app.register(createRoomRoute);
app.register(createRoomFromAudioRoute);
app.register(createQuestionRoute);
app.register(getRoomRoute);
app.register(getQuestionsByRoomRoute);
app.register(uploadAudioRoute);

app.listen({port: env.PORT }).then(() => {
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
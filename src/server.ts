import { fastify } from 'fastify';
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import {fastifyCors} from '@fastify/cors'
import { sql } from './db/connection.ts'
import { env } from './env.ts';

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
    origin: '*', // Allow all origins
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)


app.get('/health', () =>{
    return 'OK'
})

app.listen({port: env.PORT }).then(() => {
    console.log(`Server is running on http://localhost:${env.PORT}`)
})
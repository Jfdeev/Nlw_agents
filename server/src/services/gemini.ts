import { GoogleGenAI } from '@google/genai'
import { env } from '../env.ts'

const gemini = new GoogleGenAI({
   apiKey: env.GEMINI_API_KEY,
})

const model = 'gemini-2.5-flash'

export async function transcribeAudio(audioBase64: string, mimeType: string) {
    const response = await gemini.models.generateContent({
        model,
        contents: {
            text: 'Transcreva para mim o audio, sem tirar nada e nem gerar coisas a mais, apenas transcreva de forma clara e objetiva. Na lingua Portugues Brasil.',
            inlineData: {
                mimeType,
                data: audioBase64,
            }
        },
        
    })

    if(!response.text) {
        throw new Error('Erro ao transcrever o áudio')
    }


    return response.text
}
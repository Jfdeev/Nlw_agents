import { GoogleGenAI } from '@google/genai'
import { env } from '../env.ts'
import { transcode } from 'buffer';

const gemini = new GoogleGenAI({
   apiKey: env.GEMINI_API_KEY,
})

const model = 'gemini-2.5-flash'

export async function transcribeAudio(audioBase64: string, mimeType: string) {
  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Transcreva para mim o áudio, sem tirar nada e nem gerar coisas a mais, apenas transcreva de forma clara e objetiva. Na língua Portuguesa Brasil."
          },
          {
            inlineData: {
              mimeType,
              data: audioBase64
            }
          }
        ]
      }
    ]
  });

  if (!response.text) {
    throw new Error("Erro ao transcrever o áudio");
  }

  return response.text;
}

export async function generateEmbeddings(text: string) {
    const response = await gemini.models.embedContent({
        model: 'text-embedding-004',
        contents: [{ text }],
        config: {
            taskType: 'RETRIEVAL_DOCUMENT'
        }
    })

    if(!response.embeddings) {
        throw new Error("Erro ao gerar os embeddings");
    }

    return response.embeddings[0].values;
}

export async function generateAnswer(question: string, transcriptions: string[]) {
  const context = transcriptions.join('\n\n');

  const prompt = `Você é um assistente educacional especializado em explicar conceitos de forma didática.

CONTEXTO DA AULA: ${context}

PERGUNTA DO ALUNO: ${question}

INSTRUÇÕES PARA RESPONDER:

1. ANÁLISE DO CONTEXTO:
   - Primeiro, identifique o TEMA GERAL da aula (ex: banco de dados, programação, matemática, etc.)
   - Extraia os CONCEITOS PRINCIPAIS sendo discutidos
   - NÃO reproduza literalmente as palavras exatas da transcrição

2. ESTRATÉGIA DE RESPOSTA:

   SE a pergunta for sobre um CONCEITO GERAL relacionado ao tema:
   - Responda como um educador experiente
   - Use seus conhecimentos para explicar o conceito de forma clara e didática
   - Mencione: "Com base no que foi discutido na aula sobre [tema]..."
   - Dê exemplos práticos e fáceis de entender

   SE a pergunta for sobre algo MUITO ESPECÍFICO mencionado na aula:
   - Cite o trecho relevante usando: "Durante a aula foi mencionado que..."
   - Complemente com explicação educativa

   SE a pergunta NÃO tiver relação com o tema da aula:
   - Responda: "Esta pergunta não está relacionada ao tema da aula. O conteúdo discutido foi sobre [tema identificado]."

3. ESTILO DA RESPOSTA:
   - Tom educativo e profissional
   - Linguagem clara e acessível
   - Estrutura: definição → explicação → exemplo (quando apropriado)
   - Português Brasil
   - Evite repetir frases literais da transcrição, exceto quando necessário

4. ESTRUTURA IDEAL:
   - Introdução: "Com base no que foi discutido na aula sobre [tema]..."
   - Explicação: Conceito explicado de forma didática
   - Contextualizacão: Como se relaciona com o tema da aula (se relevante)
   - Conclusão/exemplo: Para fixar o aprendizado
   - Nao respoda a pergunta de forma identada, use parágrafos normais, sem nenhum tipo de marcação ou formatação.

Responda de forma educativa e clara:`.trim();

  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: prompt
      }
    ]
  })

  if(!response.text) {
    throw new Error("Erro ao gerar a resposta");
  }

  return response.text;
}

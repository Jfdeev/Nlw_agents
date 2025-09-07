import { GoogleGenAI } from '@google/genai'
import { env } from '../env.ts'

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

  const prompt = `Você é um assistente educacional especializado em explicar conceitos de forma didática e clara.

CONTEXTO DA AULA: ${context}

PERGUNTA DO ALUNO: ${question}

INSTRUÇÕES PARA RESPONDER:

1. ANÁLISE DO CONTEXTO:
   - Identifique o TEMA PRINCIPAL da aula (ex: banco de dados, programação, matemática, etc.)
   - Extraia os CONCEITOS-CHAVE sendo discutidos
   - Identifique se a pergunta é sobre um conceito GERAL ou algo ESPECÍFICO da aula

2. ESTRATÉGIA DE RESPOSTA:

   PARA CONCEITOS GERAIS (ex: "O que é uma tabela?", "Como funciona SQL?"):
   - Responda como um professor experiente
   - Dê uma explicação clara e didática do conceito
   - Use linguagem acessível e exemplos práticos
   - Comece com: "Com base no tema da aula sobre [tema], posso explicar que..."
   - NÃO cite frases específicas da transcrição

   PARA PERGUNTAS ESPECÍFICAS (ex: "O professor mencionou 32 tabelas, por quê?"):
   - Cite o contexto específico: "Durante a aula foi mencionado que..."
   - Explique o contexto e complete com conhecimento educativo

   PARA PERGUNTAS SEM RELAÇÃO:
   - "Esta pergunta não se relaciona com o conteúdo da aula sobre [tema]."

3. ESTILO DA RESPOSTA:
   - Tom educativo, paciente e encorajador
   - Linguagem clara, sem jargões desnecessários
   - Estrutura: Definição → Explicação → Exemplo prático (quando apropriado)
   - Português Brasil coloquial mas profissional
   - Parágrafos normais, sem formatação especial

4. EXEMPLO DE BOA RESPOSTA:
   "Com base no tema da aula sobre banco de dados, posso explicar que uma tabela é uma estrutura fundamental onde organizamos dados relacionados. Pense nela como uma planilha do Excel, onde cada linha representa um registro (como dados de uma pessoa) e cada coluna representa um atributo específico (como nome, idade, email). Na prática, se você tem um sistema de escola, teria uma tabela para alunos, outra para professores e outra para disciplinas, cada uma armazenando informações específicas de sua categoria."

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

// Nova função para gerar metadados da sala baseado na transcrição
export async function generateRoomMetadata(transcription: string) {
  const prompt = `Analise a seguinte transcrição de uma aula e gere metadados estruturados.

TRANSCRIÇÃO: ${transcription}

INSTRUÇÕES:
1. Identifique o tema principal da aula
2. Crie um título atrativo e específico (máximo 60 caracteres)
3. Escreva uma descrição clara e informativa (máximo 200 caracteres)
4. Liste os principais tópicos abordados

RESPONDA EXATAMENTE neste formato JSON (sem formatação markdown):
{
  "suggestedTitle": "Título específico da aula baseado no conteúdo real",
  "suggestedDescription": "Descrição clara dos conceitos e temas abordados na aula",
  "mainTopic": "Área principal de conhecimento",
  "keyTopics": ["tópico1", "tópico2", "tópico3"]
}

EXEMPLOS DE BONS TÍTULOS:
- "Banco de Dados: Normalização e Dependências Funcionais"
- "JavaScript: Arrays e Métodos de Iteração" 
- "Matemática: Função Quadrática e Parábolas"

Baseie-se apenas no conteúdo real da transcrição:`;

  const response = await gemini.models.generateContent({
    model,
    contents: [{ text: prompt }]
  });

  if (!response.text) {
    throw new Error("Erro ao gerar metadados da sala");
  }

  try {
    // Limpar possível formatação markdown
    const cleanedText = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const metadata = JSON.parse(cleanedText);
    
    // Validar campos essenciais
    if (!metadata.suggestedTitle || !metadata.suggestedDescription) {
      throw new Error("Metadata incompleta");
    }
    
    // Limitar tamanhos
    metadata.suggestedTitle = metadata.suggestedTitle.substring(0, 60);
    metadata.suggestedDescription = metadata.suggestedDescription.substring(0, 200);
    
    console.log('✅ Generated metadata:', metadata);
    return metadata;
    
  } catch (parseError) {
    console.warn('⚠️ Failed to parse AI metadata response:', parseError);
    console.log('📝 Raw response:', response.text);
    
    // Fallback mais inteligente baseado na transcrição
    const fallbackTitle = generateFallbackTitle(transcription);
    const fallbackDescription = generateFallbackDescription(transcription);
    
    return {
      suggestedTitle: fallbackTitle,
      suggestedDescription: fallbackDescription,
      mainTopic: "Educação",
      keyTopics: ["Aprendizado", "Conteúdo Educativo"]
    };
  }
}

// Funções auxiliares para fallback
function generateFallbackTitle(transcription: string): string {
  const words = transcription.toLowerCase();
  
  // Detectar temas comuns
  if (words.includes('banco de dados') || words.includes('tabela') || words.includes('sql')) {
    return "Aula sobre Banco de Dados";
  } else if (words.includes('javascript') || words.includes('função') || words.includes('array')) {
    return "Aula de JavaScript";
  } else if (words.includes('matemática') || words.includes('equação') || words.includes('função')) {
    return "Aula de Matemática";
  } else if (words.includes('física') || words.includes('força') || words.includes('energia')) {
    return "Aula de Física";
  } else if (words.includes('química') || words.includes('reação') || words.includes('elemento')) {
    return "Aula de Química";
  } else {
    return "Conteúdo Educativo";
  }
}

function generateFallbackDescription(transcription: string): string {
  const preview = transcription.substring(0, 150);
  return `Aula baseada no conteúdo: ${preview}...`;
}

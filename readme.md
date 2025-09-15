# 🎙️ Whisper

> **Plataforma educacional inteligente que transforma gravações de áudio em salas interativas de aprendizado com IA**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Sobre o Projeto

**Whisper** é uma plataforma revolucionária que permite a educadores e estudantes criar salas de estudo baseadas em áudio, onde o conteúdo gravado se torna uma base de conhecimento consultável através de Inteligência Artificial.

### ✨ Principais Funcionalidades

- 🎤 **Gravação de Áudio Inteligente** - Grave conteúdo educacional diretamente no navegador
- 🤖 **IA Educacional** - Respostas contextuais baseadas no conteúdo gravado
- 📝 **Transcrição Automática** - Powered by Google Gemini AI
- 🔍 **Busca Semântica** - Encontre informações específicas usando embeddings
- 📚 **Salas Organizadas** - Crie e gerencie salas de estudo por tópico
- 💬 **Sistema Q&A** - Faça perguntas e receba respostas educativas
- 📱 **Interface Responsiva** - Funciona perfeitamente em todos os dispositivos

## 🎯 Como Funciona

### Para Educadores
1. **📹 Grave sua aula** - Use o microfone para gravar explicações
2. **🤖 IA processa** - Sistema gera título, descrição e transcrição automática
3. **🏠 Sala criada** - Sala de estudo pronta para receber perguntas
4. **📤 Compartilhe** - Envie o link para seus alunos

### Para Estudantes
1. **🔍 Encontre salas** - Explore salas de diferentes tópicos
2. **❓ Faça perguntas** - Digite dúvidas sobre o conteúdo
3. **💡 Receba respostas** - IA responde baseada no áudio gravado
4. **📚 Aprenda mais** - Faça quantas perguntas precisar

## 🛠️ Stack Tecnológica

### Frontend
- **React 18+** - Interface de usuário moderna
- **TypeScript** - Type safety e melhor DX
- **Tailwind CSS** - Styling utility-first
- **React Query** - Gerenciamento de estado server
- **React Router** - Roteamento SPA
- **Vite** - Build tool ultra-rápida

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Fastify** - Web framework performático
- **TypeScript** - Type safety no servidor
- **Drizzle ORM** - Type-safe database queries
- **Zod** - Schema validation

### Banco de Dados & IA
- **PostgreSQL 14+** - Banco relacional
- **pgvector** - Extensão para busca vetorial
- **Google Gemini AI** - Transcrição e geração de texto
- **Embeddings** - Busca semântica avançada

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL 14+ com extensão pgvector
- Conta Google Cloud com Gemini AI habilitada

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/whisper.git
cd whisper
```

### 2. Configuração do Backend

```bash
# Navegue para o diretório do servidor
cd server

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

**Configure seu `.env`:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whisper"

# Google Gemini AI
GEMINI_API_KEY="sua_api_key_do_gemini"

# Server
PORT=3333
```

```bash
# Execute as migrações
npm run db:migrate

# Inicie o servidor de desenvolvimento
npm run dev
```

### 3. Configuração do Frontend

```bash
# Em outro terminal, navegue para o frontend
cd website

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### 4. Configuração do Banco de Dados

```sql
-- Conecte ao PostgreSQL e execute:
CREATE DATABASE whisper;

-- Conecte ao banco whisper
\c whisper

-- Instale a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;
```

## 🔧 Scripts Disponíveis

### Backend (`/server`)
```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run db:generate  # Gera migrações
npm run db:migrate   # Executa migrações
npm run db:studio    # Interface visual do banco
```

### Frontend (`/website`)
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build de produção
npm run lint         # Executa ESLint
```

## 📁 Estrutura do Projeto

```
whisper/
├── server/                 # Backend (Node.js + Fastify)
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (Gemini AI)
│   │   ├── db/            # Database schema e conexão
│   │   └── server.ts      # Servidor principal
│   └── package.json
├── website/               # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── main.tsx      # Entry point
│   └── package.json
└── README.md
```

## 🌐 Endpoints da API

### Salas
- `GET /rooms` - Lista todas as salas
- `POST /rooms` - Cria nova sala manual
- `POST /rooms/from-audio` - Cria sala a partir de áudio
- `POST /rooms/:roomId/audio` - Adiciona áudio à sala

### Perguntas
- `POST /questions` - Faz pergunta sobre conteúdo da sala

## 💡 Exemplos de Uso

### Criando uma Sala via Áudio
```javascript
const formData = new FormData();
formData.append('audio', audioBlob);

const response = await fetch('http://localhost:3333/rooms/from-audio', {
  method: 'POST',
  body: formData
});

const { room, chunk } = await response.json();
```

### Fazendo uma Pergunta
```javascript
const response = await fetch('http://localhost:3333/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 'uuid-da-sala',
    question: 'O que é React?'
  })
});

const { questionId } = await response.json();
```

## 🔒 Segurança

- ✅ Validação de input em todas as rotas
- ✅ Sanitização de uploads de áudio
- ✅ Rate limiting implementado
- ✅ CORS configurado adequadamente
- ✅ Headers de segurança HTTP

## 📊 Performance

- ⚡ Transcrição de áudio: < 30 segundos
- ⚡ Geração de resposta: < 10 segundos
- ⚡ Busca semântica: < 2 segundos
- ⚡ Interface responsiva: < 1 segundo

## 🧪 Testes

```bash
# Backend
cd server
npm run test

# Frontend  
cd website
npm run test
```

## 📈 Roadmap

### v2.0 - Colaboração
- [ ] Sistema de autenticação
- [ ] Salas privadas
- [ ] Comentários e avaliações
- [ ] Notificações

### v3.0 - Organização
- [ ] Tags e categorias
- [ ] Busca global
- [ ] Favoritos
- [ ] Analytics avançados

### v4.0 - Enterprise
- [ ] API pública
- [ ] Integração com LMS
- [ ] White-label solution
- [ ] Multi-tenancy

## 🤝 Contribuição

Contribuições são bem-vindas! Veja como contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Seguir os padrões de código existentes
- Adicionar testes para novas funcionalidades
- Atualizar documentação quando necessário
- Usar conventional commits

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Seu Nome** - *Desenvolvimento inicial* - [@Jfdeev](https://github.com/Jfdeev)

## 🙏 Agradecimentos

- Google Gemini AI pela poderosa API de IA
- Comunidade open source pelas ferramentas incríveis
- Todos os contribuidores do projeto


<div align="center">

**[⬆ Voltar ao topo](#-whisper)**

Feito com ❤️ para democratizar a educação através da tecnologia

</div>

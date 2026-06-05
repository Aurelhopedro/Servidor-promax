# MCP Agregador — 1 Mensagem, Máximo Retorno

> Servidor MCP (Model Context Protocol) que funciona como agregador central entre o Claude e o n8n.  
> **1 mensagem no Claude = 9 equipas, +80 ferramentas, execução automática até ao fim.**

---

## O que é isto?

O MCP Agregador liga o Claude ao teu n8n self-hosted. Envias uma mensagem ao Claude, ele analisa, divide em subtarefas e delega para as equipas certas — tudo automaticamente.

```
[TU]
  │  1 mensagem
  ▼
[CLAUDE — Orquestrador]
  • Analisa o pedido
  • Divide em subtarefas
  • Delega para cada equipa
  │
  ▼
[MCP AGREGADOR — Este servidor]
  • Recebe as tarefas do Claude
  • Envia para o n8n via webhook
  • Guarda estado (Supabase)
  │
  ▼
[n8n — Worker]
  • Executa cada tarefa até ao fim
  • Usa Groq como motor IA
  • Reporta resultado de volta
```

---

## Equipas disponíveis (9 equipas, +80 ferramentas)

| # | Equipa | Ferramentas |
|---|--------|-------------|
| 1 | **Code** | GitHub, E2B sandboxes, SonarQube |
| 2 | **Video** | Creatomate, Shotstack, Cloudinary |
| 3 | **Scheduling** | n8n, QStash, Agenda local |
| 4 | **Social** | Facebook (16 tools), Instagram, Twitter, LinkedIn, TikTok, YouTube |
| 5 | **Market** | SerpAPI, Brave Search, Tavily |
| 6 | **Marketing** | Brevo, HubSpot, Notion |
| 7 | **Content** | Groq, Mistral, WordPress |
| 8 | **Publishing** | Ghost, Medium, ePub/PDF, livros capítulo a capítulo |
| 9 | **Creative** | Stability AI, ElevenLabs, Replicate |

---

## Instalação

### Pré-requisitos

- Node.js 20 ou superior
- Conta [Render](https://render.com), [Railway](https://railway.app) ou [Vercel](https://vercel.com) (para deploy)
- n8n self-hosted (para execução das tarefas)
- Conta [Supabase](https://supabase.com) (gratuita, para persistência)

### 1. Clonar o repositório

```bash
git clone https://github.com/Aurelhopedro/Servidor-promax.git
cd Servidor-promax
npm install
```

### 2. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

Abre o `.env` e preenche **obrigatoriamente** estas variáveis:

```env
# Chave de segurança do servidor MCP (gera uma aleatória)
MCP_API_KEY=gera_com_o_comando_abaixo

# Segredo partilhado com o n8n para validar callbacks
N8N_CALLBACK_SECRET=gera_com_o_comando_abaixo

# URL do webhook do teu n8n
N8N_WEBHOOK_URL=https://SEU-N8N.up.railway.app/webhook/SEU-ID

# URL pública deste servidor (preenchida automaticamente no Render)
MCP_CALLBACK_URL=https://SEU-SERVIDOR.onrender.com/callback

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

Para gerar as chaves seguras:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

As restantes variáveis (GitHub, Groq, Meta, etc.) são **opcionais** — só precisas das que correspondem às equipas que queres usar.

### 3. Preparar a base de dados Supabase

No painel do Supabase, abre o **SQL Editor** e executa o conteúdo do ficheiro:

```
supabase_mcp_tasks.sql
```

Isto cria a tabela de tarefas necessária para o orquestrador.

### 4. Deploy (escolhe uma plataforma)

#### Render (recomendado — gratuito)

1. Vai a [render.com](https://render.com) → New → Web Service
2. Liga ao teu repositório GitHub
3. As configurações já estão no `render.yaml`:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
4. Em **Environment**, adiciona todas as variáveis do teu `.env`
5. Deploy → copia a URL pública (ex: `https://servidor-promax.onrender.com`)

#### Railway

1. Vai a [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. As configurações já estão no `railway.json`
3. Adiciona as variáveis de ambiente no painel
4. Deploy automático

#### Desenvolvimento local

```bash
npm run dev
# Servidor disponível em http://localhost:3000
```

---

## Ligar ao Claude

### Claude Desktop

Abre o ficheiro de configuração do Claude Desktop:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Adiciona:

```json
{
  "mcpServers": {
    "promax": {
      "url": "https://SEU-SERVIDOR.onrender.com/sse",
      "headers": {
        "Authorization": "Bearer SUA_MCP_API_KEY"
      }
    }
  }
}
```

Reinicia o Claude Desktop. Deves ver as ferramentas disponíveis no ícone de ferramentas.

### Claude.ai (via MCP remoto)

No Claude.ai → Settings → Integrations → Add MCP Server:

```
URL: https://SEU-SERVIDOR.onrender.com/sse
```

O servidor suporta OAuth automaticamente — o Claude.ai vai autenticar sem configuração adicional.

---

## Verificar que está a funcionar

Acede ao health check do servidor:

```
GET https://SEU-SERVIDOR.onrender.com/health
```

Resposta esperada:
```json
{
  "name": "mcp-agregador",
  "status": "ok",
  "teams": 9,
  "tools": 83,
  "authEnabled": true
}
```

---

## Comandos de desenvolvimento

```bash
npm run dev        # Desenvolvimento com hot-reload
npm run build      # Compilar TypeScript → dist/
npm run start      # Iniciar em produção (após build)
npm run typecheck  # Verificar tipos sem compilar
```

---

## Segurança

- **Bearer token** com comparação segura contra timing attacks
- **HMAC-SHA256** para validar callbacks do n8n
- **Rate limiting** por IP (60 req/min por defeito, configurável)
- O `.env` nunca é enviado para o repositório
- Em modo dev (sem `MCP_API_KEY`), o servidor avisa e aceita todas as ligações

---

## Tecnologias

- **Node.js 20+** + **TypeScript 5+**
- `@modelcontextprotocol/sdk` — SDK oficial MCP
- `zod` — validação de inputs
- `axios` — chamadas HTTP
- `@supabase/supabase-js` — persistência de tarefas
- `dotenv` — variáveis de ambiente

---

## Licença

MIT — livre para uso pessoal e comercial.

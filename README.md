# MCP Agregador — 1 Mensagem, Máximo Retorno

Servidor MCP (Model Context Protocol) que funciona como agregador central entre o Claude e o n8n.

**Filosofia:** 1 mensagem no Claude = máximo retorno possível. O Claude recebe 1 mensagem, analisa, divide em subtarefas e delega. O n8n recebe e executa tudo até ao fim.

## Arquitetura

```
[UTILIZADOR]
     │
     ▼
[CLAUDE — Orquestrador]
  • Recebe 1 mensagem
  • Analisa o pedido
  • Divide em subtarefas
  • Agenda ou delega imediatamente
     │
     ▼
[MCP AGREGADOR — Este servidor]
  • Recebe as tarefas do Claude
  • Envia para o n8n via webhook
  • Guarda estado das tarefas
     │
     ▼
[n8n self-hosted — Worker]
  • Recebe as tarefas
  • Executa cada uma até terminar
  • Usa Groq como IA de execução
  • Reporta resultado de volta ao MCP
```

## Equipas (9 no total)

| # | Equipa | Descrição | Ferramentas |
|---|--------|-----------|-------------|
| 1 | **Code** | GitHub, E2B sandboxes, SonarQube | Criar repos, issues, executar código, análise qualidade |
| 2 | **Video** | Creatomate, Shotstack, Cloudinary | Renderizar vídeos, upload, transformações |
| 3 | **Scheduling** | n8n, QStash, Agenda local | Enviar tarefas, agendar cron, gerir agenda |
| 4 | **Social** | Facebook (16 tools!), Instagram, Twitter, LinkedIn, TikTok, YouTube | Posts, reels, stories, insights, messenger, ads |
| 5 | **Market** | SerpAPI, Brave Search, Tavily | Pesquisa web, tendências, extração conteúdo |
| 6 | **Marketing** | Brevo, HubSpot, Notion | Email, CRM, gestão conteúdo |
| 7 | **Content** | Groq, Mistral, WordPress | Geração texto IA, publicação blog |
| 8 | **Publishing** | Book Generator, Ghost, Medium, ePub/PDF | Livros capítulo a capítulo, artigos SEO, multi-plataforma |
| 9 | **Creative** | Stability AI, ElevenLabs, Replicate | Imagens, voz, modelos IA |

## Facebook — 16 Ferramentas Completas

- `social_fb_post_text` — Publicar post de texto
- `social_fb_post_image` — Publicar post com imagem
- `social_fb_post_video` — Publicar vídeo
- `social_fb_post_reel` — Publicar Reel
- `social_fb_post_story` — Publicar Story
- `social_fb_schedule_post` — Agendar publicação
- `social_fb_get_page_insights` — Ver métricas da página
- `social_fb_reply_comment` — Responder comentário
- `social_fb_delete_comment` — Apagar comentário
- `social_fb_like_comment` — Dar like em comentário
- `social_fb_send_message` — Enviar mensagem via Messenger
- `social_fb_create_event` — Criar evento na página
- `social_fb_get_leads` — Obter leads de formulários
- `social_fb_manage_group_post` — Publicar em grupos
- `social_fb_get_post_analytics` — Métricas de post específico
- `social_fb_boost_post` — Impulsionar post (Meta Ads)

## Arranque Rápido

```bash
npm install
cp .env.example .env
# Preencher as variáveis no .env
npm run dev
```

## Desenvolvimento

```bash
npm run dev          # Desenvolvimento com tsx
npm run build        # Compilar TypeScript
npm run start        # Produção
npm run typecheck    # Verificar tipos
```

## Tecnologias

- Node.js 20+
- TypeScript 5+
- `@modelcontextprotocol/sdk` — SDK oficial MCP
- `dotenv` — variáveis de ambiente
- `zod` — validação de inputs
- `axios` — chamadas HTTP
- `tsx` — desenvolvimento

## Regras de Free Tier

Cada ferramenta implementa:
1. **Retry automático** em caso de rate limit (429)
2. **Backoff exponencial** para respeitar limites
3. **Comentários** indicando limites gratuitos de cada API
4. Usa **Groq** como motor IA principal (o mais generoso gratuitamente)

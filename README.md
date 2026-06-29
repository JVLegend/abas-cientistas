# Abas Cientistas

**Extensão Chrome criada e adaptada por João Victor para organizar abas abertas com lógica de cientista de dados.**

Abas Cientistas transforma a nova aba do Chrome em um painel de trabalho para quem vive entre código, GitHub, documentação, notebooks, papers, vídeos, mensageria e ferramentas de IA. Em vez de uma lista genérica de abas, a extensão tenta entender o contexto de cada página e agrupar o navegador como um workspace de pesquisa e desenvolvimento.

## Autoria

Projeto criado, adaptado e mantido por **João Victor**.

Este repositório nasce como uma ferramenta própria para cientistas de dados, pesquisadores, desenvolvedores de ML, analistas e builders que alternam entre código, leitura, vídeos, comunicação e experimentos.

## Para Quem

- Cientistas de dados com muitas abas abertas.
- Pesquisadores que alternam entre papers, benchmarks e repositórios.
- Desenvolvedores de ML que trabalham com GitHub, Colab, Kaggle, Hugging Face e documentação.
- Builders que ficam entre deploys, dashboards, apps e ferramentas de IA.
- Pessoas que estudam por vídeos, palestras, cursos e tutoriais.

## O Que Ele Reconhece

- **GitHub e versionamento**: GitHub, Gists, GitLab, issues, pull requests, commits e repositórios.
- **Código e documentação**: Stack Overflow, MDN, docs de Python, pandas, NumPy, scikit-learn, PyTorch, TensorFlow e APIs.
- **Notebooks e experimentos**: Colab, Kaggle, Observable, Databricks, Jupyter, datasets, benchmarks e execuções de treino.
- **Deploys, produto e observabilidade**: Vercel, Supabase, Railway, logs, builds, dashboards, bancos e monitoramento.
- **Aplicativos e ferramentas**: Hugging Face, Notion, Figma, Replit, CodeSandbox, Snowflake, Airtable e ferramentas de apoio.
- **Mensageria e coordenação**: Gmail, WhatsApp Web, Slack, Discord, Teams, Linear, Trello e tarefas.
- **Curtos e inspiração rápida**: YouTube Shorts, Reels, TikTok e clipes.
- **Palestras, aulas e cursos**: YouTube, Coursera, edX, Udemy, fast.ai, DataCamp, workshops e talks.
- **YouTube e vídeos**: vídeos, playlists e páginas de watch.
- **Papers e pesquisa**: arXiv, Google Scholar, Papers with Code, OpenReview, Semantic Scholar, NeurIPS, ICML, ICLR e benchmarks.
- **IA e copilotos**: ChatGPT, Claude, Gemini, Perplexity, ferramentas de agentes e copilotos.

## Recursos

- Agrupamento automático das abas abertas por contexto de trabalho.
- Status por aba: `Codar`, `Executar`, `Responder`, `Ler`, `Assistir`, `Revisar` e `Fechar provável`.
- Painel **Foco agora** com as abas mais importantes para retomar o trabalho.
- Painel **Limpeza sugerida** para duplicadas, excesso de abas, curtos, mensageria e ambientes locais.
- Sidebar de grupos com filtro rápido e busca global por projeto, repo, paper, app ou domínio.
- Tema claro e escuro com preferência salva no navegador.
- Tipografia com fontes de sistema, sem dependência remota, para evitar bloqueios de CSP no Chrome.
- Fontes maiores, cantos arredondados e microanimações leves.
- Lista **Revisar depois** para salvar links importantes antes de fechar.
- Detecção de abas duplicadas com ação rápida para manter uma cópia.
- Ações diretas para focar, salvar ou fechar abas.
- Funcionamento local, sem servidor e sem conta.

## Privacidade

O Abas Cientistas usa permissões do Chrome para ler as abas abertas e montar a visão de trabalho localmente. A lista **Revisar depois** fica em `chrome.storage.local`.

Nenhum dado é enviado para servidor externo. A extensão não faz upload de abas, histórico, código, mensagens, repositórios ou páginas de pesquisa.

## Instalação Para Teste Local

1. Abra o Chrome em `chrome://extensions`.
2. Ative **Developer mode**.
3. Clique em **Load unpacked**.
4. Selecione a pasta:

```text
/Users/iaparamedicos/Documents/GitHub/abas-cientistas/extension
```

5. Abra uma nova aba. A tela do **Abas Cientistas** aparecerá lendo suas abas atuais.

Abrir `extension/index.html` diretamente no navegador não permite ler abas reais, por limitação de segurança do Chrome. Para testar de verdade, use a instalação como extensão.

## Estrutura

```text
extension/
  manifest.json      Configuração da extensão Chrome
  index.html         Estrutura visual da nova aba
  style.css          Temas, layout e tipografia
  app.js             Leitura das abas, agrupamento e interações
  background.js      Badge da extensão com contagem de abas
  icons/             Ícones da extensão
```

## Como Evoluir

- Adicionar regras por stack: Python, R, JS/TS, ML, data engineering, MLOps.
- Criar grupos por projeto ou cliente.
- Separar abas de leitura, implementação, debug e deploy.
- Detectar ambientes locais (`localhost`) por porta e framework.
- Adicionar regras personalizadas por usuário.
- Preparar empacotamento para publicação na Chrome Web Store.

## Publicação Como Extensão Chrome

Sim, é possível publicar como extensão Chrome. O projeto já usa Manifest V3. Para publicação, será necessário preparar ícones finais, screenshots, política de privacidade, pacote da pasta `extension/` e submissão no Chrome Web Store Developer Dashboard.

## Licença

Este projeto mantém os avisos de licença aplicáveis no arquivo `LICENSE`.

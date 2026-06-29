# Abas Cientistas

**Abas Cientistas** transforma a nova aba do Chrome em um painel de trabalho para cientistas de dados, pesquisadores, builders e desenvolvedores de ML.

Em vez de mostrar apenas uma lista de abas abertas, a extensão tenta entender o contexto de cada página: código, GitHub, notebooks, papers, vídeos, mensageria, deploys, IA e materiais de estudo. A ideia é simples: abrir uma nova aba e enxergar rapidamente onde está o trabalho, o que merece foco e o que pode ser limpo.

Criado, adaptado e mantido por **João Victor**.

## Para Que Serve

Abas Cientistas ajuda quando o navegador virou parte do laboratório de trabalho:

| Situação | Como a extensão ajuda |
| --- | --- |
| Muitas abas de GitHub, docs e Stack Overflow | Agrupa por contexto e destaca abas de código. |
| Papers, benchmarks e repositórios misturados | Separa pesquisa, papers e experimentos. |
| YouTube, cursos e shorts competindo com trabalho profundo | Diferencia aulas, vídeos longos e curtos. |
| Slack, Gmail, WhatsApp e tarefas abertas | Marca como abas de resposta/coordenação. |
| Deploys, logs, dashboards e localhost | Ajuda a reconhecer execução, produto e observabilidade. |
| Abas duplicadas e sessão pesada | Sugere limpezas sem fechar nada automaticamente. |

## Principais Recursos

- Nova aba do Chrome com layout em formato de cockpit.
- Agrupamento automático das abas abertas por contexto de ciência de dados.
- Status por aba: `Codar`, `Executar`, `Responder`, `Ler`, `Assistir`, `Revisar` e `Fechar provável`.
- Painel **Foco agora** com as abas mais importantes para retomar o trabalho.
- Painel **Limpeza sugerida** para duplicadas, excesso de abas, curtos, mensageria e ambientes locais.
- Sidebar de grupos com filtro rápido.
- Busca global por projeto, repo, paper, app, domínio ou palavra do título.
- Tema claro e escuro.
- Lista **Revisar depois** salva localmente no navegador.
- Ações rápidas para focar, salvar ou fechar abas.
- Funcionamento local, sem conta, sem servidor e sem telemetria.

## Grupos Reconhecidos

| Grupo | Exemplos |
| --- | --- |
| GitHub e versionamento | GitHub, GitLab, Bitbucket, PRs, issues, commits, branches. |
| Código e documentação | Stack Overflow, MDN, Python docs, pandas, NumPy, PyTorch, TensorFlow, localhost. |
| Notebooks e experimentos | Colab, Kaggle, Observable, Databricks, Jupyter, datasets e benchmarks. |
| Deploys e observabilidade | Vercel, Supabase, Railway, logs, builds, dashboards e monitoramento. |
| Aplicativos e ferramentas | Hugging Face, Notion, Figma, Replit, CodeSandbox, Snowflake, Airtable. |
| Mensageria e coordenação | Gmail, WhatsApp Web, Slack, Discord, Teams, Trello, Asana. |
| Curtos e inspiração rápida | YouTube Shorts, Reels, TikTok e clipes. |
| Palestras, aulas e cursos | YouTube, Coursera, edX, Udemy, fast.ai, DataCamp e workshops. |
| YouTube e vídeos | Vídeos, playlists e páginas de watch. |
| Papers e pesquisa | arXiv, Google Scholar, Papers with Code, OpenReview, Semantic Scholar, NeurIPS, ICML, ICLR. |
| IA e copilotos | ChatGPT, Claude, Gemini, Perplexity, Cursor, v0 e ferramentas de agentes. |

## Instalação Rápida Pelo Pacote

1. Abra a página de releases: [github.com/JVLegend/abas-cientistas/releases](https://github.com/JVLegend/abas-cientistas/releases).
2. Baixe o arquivo `abas-cientistas-extension.zip` da versão mais recente.
3. Descompacte o arquivo no seu computador.
4. Abra o Chrome em `chrome://extensions`.
5. Ative **Developer mode**.
6. Clique em **Load unpacked**.
7. Selecione a pasta descompactada `abas-cientistas-extension`.
8. Abra uma nova aba.

Se a extensão estiver instalada corretamente, a nova aba do Chrome passa a mostrar o painel **Abas Cientistas** com suas abas reais.

Guia detalhado: [docs/INSTALACAO_CHROME.md](docs/INSTALACAO_CHROME.md)

## Instalação Pelo Código-Fonte

Também é possível clonar o repositório e carregar a pasta `extension/` diretamente:

```bash
git clone https://github.com/JVLegend/abas-cientistas.git
```

Depois, em `chrome://extensions`, use **Load unpacked** e selecione:

```text
abas-cientistas/extension
```

Importante: abrir `extension/index.html` diretamente no navegador não permite ler abas reais. A API `chrome.tabs` só funciona quando a pasta é carregada como extensão.

## Como Usar

- Abra uma nova aba para ver o cockpit.
- Use a busca no topo para filtrar por repo, projeto, paper, app ou domínio.
- Clique em um grupo na lateral para focar apenas naquele contexto.
- Veja o painel **Foco agora** para retomar as abas de maior prioridade.
- Veja **Limpeza sugerida** para reduzir duplicadas, curtos e excesso de abas.
- Use `Revisar depois` para guardar uma aba antes de fechar.
- Use o tema claro/escuro conforme o ambiente de trabalho.

Guia de uso: [docs/GUIA_DE_USO.md](docs/GUIA_DE_USO.md)

## Privacidade

Abas Cientistas foi desenhado para funcionar localmente.

- Não envia abas, histórico, mensagens, repositórios, código ou papers para servidores externos.
- Não exige login.
- Não tem backend.
- Não tem telemetria.
- Usa `chrome.tabs` para ler abas abertas e `chrome.storage.local` para salvar a lista **Revisar depois**.

Leia mais: [docs/PRIVACIDADE.md](docs/PRIVACIDADE.md)

## Estrutura Do Projeto

```text
extension/
  manifest.json      Configuração Manifest V3 da extensão Chrome
  index.html         Estrutura visual da nova aba
  style.css          Temas, layout, responsividade e microinterações
  app.js             Leitura das abas, agrupamento, status e ações
  background.js      Badge da extensão com contagem de abas
  icons/             Ícones da extensão

docs/
  INSTALACAO_CHROME.md
  GUIA_DE_USO.md
  PRIVACIDADE.md
  PUBLICACAO_CHROME_WEB_STORE.md

scripts/
  package-extension.sh
```

## Gerar Um Pacote Local

```bash
./scripts/package-extension.sh
```

O script gera:

```text
dist/abas-cientistas-extension.zip
```

Esse `.zip` é o pacote anexado às releases do GitHub.

## Roadmap

- Regras personalizadas por projeto, cliente ou stack.
- Detecção mais fina de notebooks, branches, PRs e ambientes locais.
- Exportação/importação de regras pessoais.
- Melhor empacotamento para Chrome Web Store.
- Screenshots e página pública do projeto.

## Licença

Este projeto mantém os avisos de licença aplicáveis no arquivo [LICENSE](LICENSE).

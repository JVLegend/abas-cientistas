# Guia De Uso

O **Abas Cientistas** foi feito para transformar uma sessão cheia de abas em uma visão de trabalho mais clara.

## A Tela Principal

A nova aba tem três áreas principais:

| Área | Função |
| --- | --- |
| Sidebar de grupos | Filtra rapidamente por GitHub, Código, Papers, IA, Mensageria e outros contextos. |
| Centro do painel | Mostra os grupos de abas e as ações de cada grupo. |
| Coluna de inteligência | Mostra **Foco agora**, **Limpeza sugerida** e **Revisar depois**. |

## Busca Global

Use a busca no topo para encontrar abas por:

- nome do projeto
- nome do repositório
- domínio
- título da página
- paper
- app
- ferramenta

Exemplos:

```text
numerai
openreview
github
localhost
paper
colab
```

## Status Das Abas

Cada aba recebe uma intenção provável:

| Status | Significado |
| --- | --- |
| Codar | PRs, issues, docs técnicas, localhost, erro, debug ou Stack Overflow. |
| Executar | Deploys, builds, dashboards, logs, bancos e monitoramento. |
| Responder | Gmail, Slack, WhatsApp, Discord, Teams e coordenação. |
| Ler | Papers, arXiv, Scholar, OpenReview e referências. |
| Assistir | YouTube, aulas, cursos, palestras e playlists. |
| Revisar | Apps, IA, notebooks e materiais que pedem avaliação. |
| Fechar provável | Curtos, reels, clipes ou abas de baixa prioridade. |

O status é uma heurística local. Ele não usa IA externa nem envia dados para fora.

## Foco Agora

O painel **Foco agora** destaca as abas mais importantes para retomar o trabalho.

Ele considera:

- aba ativa
- GitHub, PRs e issues
- erros, debug e localhost
- deploys, logs e dashboards
- papers, benchmarks e notebooks
- menor prioridade para curtos/reels

## Limpeza Sugerida

O painel **Limpeza sugerida** aponta situações que costumam deixar o navegador pesado:

- abas duplicadas
- muitas abas abertas
- muitos curtos/reels
- muitas abas de mensageria
- muitos ambientes locais
- excesso de GitHub/código aberto

A extensão sugere, mas não fecha tudo sozinha. Você escolhe a ação.

## Revisar Depois

Use **Revisar depois** quando uma aba é importante, mas não precisa ficar aberta.

O link é salvo em `chrome.storage.local`, no seu navegador. Depois você pode marcar como concluído ou remover.

## Ações Rápidas

| Ação | O que faz |
| --- | --- |
| Clicar em uma aba | Foca a aba real no Chrome. |
| Salvar | Move para **Revisar depois** e fecha a aba. |
| Fechar | Fecha a aba. |
| Fechar grupo | Fecha todas as abas daquele grupo. |
| Fechar duplicadas | Mantém uma cópia de cada URL e fecha as repetidas. |

## Tema Claro E Escuro

O seletor no topo salva sua preferência no navegador.

## Boas Práticas

- Use o painel como primeira tela do dia.
- Limpe duplicadas antes de começar trabalho profundo.
- Salve leituras longas em **Revisar depois**.
- Feche curtos quando estiver em modo produção.
- Use a busca para agrupar por projeto quando a sessão estiver muito cheia.

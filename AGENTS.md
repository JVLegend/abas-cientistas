# AGENTS.md -- Abas Cientistas

Este repositório contém o **Abas Cientistas**, extensão Chrome criada e adaptada por **João Victor** para organizar abas abertas a partir da lógica de trabalho de cientistas de dados.

## Objetivo

Transformar a nova aba do Chrome em uma visão de workspace para ciência de dados, agrupando conteúdos por contexto:

- GitHub e versionamento
- Código e documentação
- Notebooks e experimentos
- Deploys, produto e observabilidade
- Aplicativos e ferramentas
- Mensageria e coordenação
- YouTube e vídeos
- Curtos e inspiração rápida
- Palestras, aulas e cursos
- Papers e pesquisa
- IA e copilotos

## Diretrizes de Produto

- Usar português do Brasil.
- Escrever para cientistas de dados, pesquisadores, builders e desenvolvedores de ML.
- Priorizar privacidade, leitura rápida e utilidade em contexto de pesquisa/código.
- Não adicionar servidor, conta ou telemetria sem decisão explícita.
- Manter o app leve: extensão Chrome pura, Manifest V3, sem build obrigatório.
- Ao adicionar regras de agrupamento, preferir padrões claros por domínio, caminho de URL e título da aba.

## Instalação Local

Carregar a pasta abaixo em `chrome://extensions` com **Developer mode** ativo:

```text
/Users/iaparamedicos/Documents/GitHub/abas-cientistas/extension
```

Abrir `extension/index.html` diretamente não lê abas reais, porque `chrome.tabs` só funciona dentro da extensão.

## Arquivos Principais

- `extension/manifest.json`: configuração da extensão.
- `extension/index.html`: estrutura da nova aba.
- `extension/style.css`: temas claro/escuro, layout e tipografia.
- `extension/app.js`: leitura das abas, agrupamento por contexto e interações.
- `extension/background.js`: badge com contagem de abas.
- `README.md`: explicação do produto e orientações de uso.

## Privacidade

A extensão lê abas abertas via `chrome.tabs` e salva itens de revisão em `chrome.storage.local`. Não enviar dados de abas, mensagens, repositórios, histórico, código ou projetos para serviços externos sem aprovação explícita.

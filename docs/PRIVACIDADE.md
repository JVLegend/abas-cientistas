# Privacidade

O **Abas Cientistas** foi desenhado para funcionar localmente no navegador.

## O Que A Extensão Lê

Para organizar a nova aba, a extensão usa a permissão `tabs` do Chrome para ler:

- título das abas abertas
- URL das abas abertas
- aba ativa
- janela da aba

Esses dados são usados apenas para montar os grupos, status e sugestões de limpeza.

## O Que A Extensão Salva

A lista **Revisar depois** é salva em:

```text
chrome.storage.local
```

Ela pode conter:

- título da página
- URL
- data de salvamento
- estado de concluído/removido

## O Que A Extensão Não Faz

Abas Cientistas não faz:

- envio de abas para servidores externos
- upload de histórico
- leitura de conteúdo interno das páginas
- login
- analytics
- telemetria
- backend próprio
- chamada para APIs externas

## Permissões Do Chrome

| Permissão | Uso |
| --- | --- |
| `tabs` | Ler abas abertas e permitir foco/fechamento de abas. |
| `activeTab` | Ajudar no contexto da aba ativa. |
| `storage` | Salvar tema e lista **Revisar depois** localmente. |

## Favicons

A interface usa favicons para facilitar reconhecimento visual dos sites. Caso o navegador bloqueie algum favicon, a extensão continua funcionando normalmente.

## Dados Sensíveis

Como a extensão lê títulos e URLs de abas abertas, ela pode exibir nomes de repositórios, documentos, mensagens ou páginas privadas que já estejam abertas no seu Chrome.

Isso fica localmente no seu navegador. Ainda assim, evite compartilhar screenshots da extensão quando houver abas privadas visíveis.

## Modelo De Confiança

Este projeto é uma extensão local de produtividade. Ele foi pensado para ser simples, auditável e sem servidor.

# Publicação Na Chrome Web Store

O projeto já usa **Manifest V3**, então pode evoluir para publicação oficial na Chrome Web Store.

## Checklist Para Publicar

- [ ] Revisar nome público, descrição curta e descrição longa.
- [ ] Preparar ícones finais em alta qualidade.
- [ ] Criar screenshots reais da extensão instalada.
- [ ] Criar política de privacidade pública.
- [ ] Gerar pacote `.zip` da pasta `extension/`.
- [ ] Criar conta no Chrome Web Store Developer Dashboard.
- [ ] Enviar o pacote para revisão.

## Gerar O Pacote

Na raiz do repositório:

```bash
./scripts/package-extension.sh
```

O arquivo gerado fica em:

```text
dist/abas-cientistas-extension.zip
```

## Observações Para Review

A extensão:

- substitui a nova aba do Chrome
- lê abas abertas para organizar a sessão
- salva dados apenas localmente
- não usa backend
- não envia telemetria
- não exige conta

## Texto Curto Sugerido

```text
Nova aba para cientistas de dados organizarem GitHub, código, papers, IA, vídeos e mensagens.
```

## Texto Longo Sugerido

```text
Abas Cientistas transforma a nova aba do Chrome em um painel de trabalho para cientistas de dados, pesquisadores, builders e desenvolvedores de ML.

A extensão organiza abas abertas por contexto, identifica status como Codar, Executar, Responder, Ler e Assistir, sugere limpezas de sessão e ajuda a retomar o foco em meio a GitHub, notebooks, papers, vídeos, IA, mensageria e deploys.

Tudo funciona localmente no navegador, sem conta, sem servidor e sem telemetria.
```

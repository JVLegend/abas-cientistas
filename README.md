<h1 align="center">🧪 Abas Cientistas</h1>

<p align="center">
  <strong>Uma nova aba do Chrome para cientistas de dados organizarem trabalho, pesquisa, código e foco.</strong>
</p>

<p align="center">
  <a href="https://github.com/JVLegend/abas-cientistas/releases/tag/v1.0.0"><img alt="Release" src="https://img.shields.io/badge/release-v1.0.0-1f8a70?style=for-the-badge"></a>
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-Manifest%20V3-31546b?style=for-the-badge">
  <img alt="Privacidade" src="https://img.shields.io/badge/privacidade-local-c47a2c?style=for-the-badge">
  <img alt="Sem backend" src="https://img.shields.io/badge/backend-zero-b94a48?style=for-the-badge">
</p>

<p align="center">
  <code>#DataScience</code>
  <code>#ChromeExtension</code>
  <code>#GitHub</code>
  <code>#Papers</code>
  <code>#Notebooks</code>
  <code>#IA</code>
  <code>#Productivity</code>
</p>

---

## ✨ O Que É

**Abas Cientistas** transforma a nova aba do Chrome em um cockpit para quem trabalha com:

| 🧑‍💻 Código | 📚 Pesquisa | 🤖 IA | 🚀 Deploy | 💬 Mensagens |
| --- | --- | --- | --- | --- |
| GitHub, docs, localhost | papers, arXiv, benchmarks | ChatGPT, Claude, Gemini | Vercel, logs, dashboards | Gmail, Slack, WhatsApp |

Ele lê suas abas abertas, organiza por contexto e mostra o que merece atenção agora.

---

## 🧭 Como O Painel Ajuda

| Área | Serve Para |
| --- | --- |
| 🎯 **Foco agora** | Retomar as abas mais importantes da sessão. |
| 🧹 **Limpeza sugerida** | Encontrar duplicadas, excesso de abas e curtos que quebram foco. |
| 🏷️ **Status da aba** | Ver se a aba é para `Codar`, `Ler`, `Responder`, `Assistir`, `Executar` ou `Fechar provável`. |
| 🗂️ **Grupos inteligentes** | Separar GitHub, código, notebooks, papers, apps, vídeos e IA. |
| 🔎 **Busca global** | Filtrar por repo, projeto, paper, app, domínio ou palavra do título. |

---

## 🧠 Grupos Inteligentes

| Tag | Grupo | Exemplos |
| --- | --- | --- |
| `GH` | 🐙 GitHub | PRs, issues, commits, branches |
| `</>` | 💻 Código | Stack Overflow, docs, localhost |
| `NB` | 📓 Notebooks | Colab, Kaggle, Jupyter, datasets |
| `UP` | 🚀 Deploy | Vercel, Supabase, logs, builds |
| `AP` | 🧰 Apps | Hugging Face, Notion, Figma |
| `DM` | 💬 Mensagens | Gmail, Slack, WhatsApp, Discord |
| `PX` | 📄 Papers | arXiv, Scholar, OpenReview |
| `YT` | ▶️ Vídeos | YouTube, cursos, playlists |
| `AI` | 🤖 IA | ChatGPT, Claude, Gemini, Perplexity |

---

## ⚡ Instalação Rápida

### 1. Baixe

➡️ [**Download do pacote v1.0.0**](https://github.com/JVLegend/abas-cientistas/releases/download/v1.0.0/abas-cientistas-extension.zip)

### 2. Instale No Chrome

```text
chrome://extensions
```

Ative **Developer mode** → clique em **Load unpacked** → selecione a pasta descompactada:

```text
abas-cientistas-extension
```

### 3. Abra Uma Nova Aba

Pronto: o Chrome passa a abrir o painel **Abas Cientistas**.

📘 Guia completo: [docs/INSTALACAO_CHROME.md](docs/INSTALACAO_CHROME.md)

---

## 🔒 Privacidade

| ✅ Faz | ❌ Não Faz |
| --- | --- |
| Lê títulos e URLs das abas abertas | Não envia dados para servidor |
| Salva `Revisar depois` localmente | Não exige login |
| Usa `chrome.storage.local` | Não tem analytics |
| Funciona sem backend | Não lê conteúdo interno das páginas |

📄 Detalhes: [docs/PRIVACIDADE.md](docs/PRIVACIDADE.md)

---

## 🛠️ Para Desenvolvedores

```bash
git clone https://github.com/JVLegend/abas-cientistas.git
cd abas-cientistas
./scripts/package-extension.sh
```

Carregue a pasta abaixo em **Load unpacked**:

```text
extension/
```

Estrutura principal:

```text
extension/
  manifest.json
  index.html
  style.css
  app.js
  background.js
  icons/
```

---

## 📚 Docs

| Documento | Link |
| --- | --- |
| 🚀 Instalação | [docs/INSTALACAO_CHROME.md](docs/INSTALACAO_CHROME.md) |
| 🧭 Guia de uso | [docs/GUIA_DE_USO.md](docs/GUIA_DE_USO.md) |
| 🔒 Privacidade | [docs/PRIVACIDADE.md](docs/PRIVACIDADE.md) |
| 🏪 Chrome Web Store | [docs/PUBLICACAO_CHROME_WEB_STORE.md](docs/PUBLICACAO_CHROME_WEB_STORE.md) |

---

## 🧬 Roadmap

- [ ] Regras personalizadas por projeto, cliente ou stack.
- [ ] Detecção mais fina de PRs, notebooks e ambientes locais.
- [ ] Exportar/importar regras pessoais.
- [ ] Screenshots oficiais da extensão.
- [ ] Preparar publicação na Chrome Web Store.

---

## 👤 Autoria

Criado, adaptado e mantido por **João Victor**.

---

## 📄 Licença

Veja [LICENSE](LICENSE).

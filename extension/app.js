/* ================================================================
   Abas Cientistas — Dashboard App (Pure Extension Edition)
   Criado e adaptado por João Victor para fluxo de trabalho cientista de dados.

   This file is the brain of the dashboard. Now that the dashboard
   IS the extension page (not inside an iframe), it can call
   chrome.tabs and chrome.storage directly — no postMessage bridge needed.

   What this file does:
   1. Reads open browser tabs directly via chrome.tabs.query()
   2. Groups tabs by domain with a landing pages category
   3. Renders domain cards, banners, and stats
   4. Handles all user actions (close tabs, save for later, focus tab)
   5. Stores "Saved for Later" tabs in chrome.storage.local (no server)
   ================================================================ */

'use strict';


/* ----------------------------------------------------------------
   CHROME TABS — Direct API Access

   Since this page IS the extension's new tab page, it has full
   access to chrome.tabs and chrome.storage. No middleman needed.
   ---------------------------------------------------------------- */

// All open tabs — populated by fetchOpenTabs()
let openTabs = [];
let canReadChromeTabs = true;

/**
 * fetchOpenTabs()
 *
 * Reads all currently open browser tabs directly from Chrome.
 * Sets the extensionId flag so we can identify Abas Cientistas' own pages.
 */
async function fetchOpenTabs() {
  try {
    if (
      typeof chrome === 'undefined' ||
      !chrome.runtime ||
      !chrome.tabs ||
      typeof chrome.tabs.query !== 'function'
    ) {
      canReadChromeTabs = false;
      openTabs = [];
      return;
    }

    canReadChromeTabs = true;
    const extensionId = chrome.runtime.id;
    // The new URL for this page is now index.html (not newtab.html)
    const newtabUrl = `chrome-extension://${extensionId}/index.html`;

    const tabs = await chrome.tabs.query({});
    openTabs = tabs.map(t => ({
      id:       t.id,
      url:      t.url,
      title:    t.title,
      windowId: t.windowId,
      active:   t.active,
      // Flag Abas Cientistas' own pages so we can detect duplicate new tabs
      isTabOut: t.url === newtabUrl || t.url === 'chrome://newtab/',
    }));
  } catch {
    canReadChromeTabs = false;
    openTabs = [];
  }
}

/**
 * closeTabsByUrls(urls)
 *
 * Closes all open tabs whose hostname matches any of the given URLs.
 * After closing, re-fetches the tab list to keep our state accurate.
 *
 * Special case: file:// URLs are matched exactly (they have no hostname).
 */
async function closeTabsByUrls(urls) {
  if (!urls || urls.length === 0) return;

  // Separate file:// URLs (exact match) from regular URLs (hostname match)
  const targetHostnames = [];
  const exactUrls = new Set();

  for (const u of urls) {
    if (u.startsWith('file://')) {
      exactUrls.add(u);
    } else {
      try { targetHostnames.push(new URL(u).hostname); }
      catch { /* skip unparseable */ }
    }
  }

  const allTabs = await chrome.tabs.query({});
  const toClose = allTabs
    .filter(tab => {
      const tabUrl = tab.url || '';
      if (tabUrl.startsWith('file://') && exactUrls.has(tabUrl)) return true;
      try {
        const tabHostname = new URL(tabUrl).hostname;
        return tabHostname && targetHostnames.includes(tabHostname);
      } catch { return false; }
    })
    .map(tab => tab.id);

  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}

/**
 * closeTabsExact(urls)
 *
 * Closes tabs by exact URL match (not hostname). Used for landing pages
 * so closing "Gmail inbox" doesn't also close individual email threads.
 */
async function closeTabsExact(urls) {
  if (!urls || urls.length === 0) return;
  const urlSet = new Set(urls);
  const allTabs = await chrome.tabs.query({});
  const toClose = allTabs.filter(t => urlSet.has(t.url)).map(t => t.id);
  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}

/**
 * focusTab(url)
 *
 * Switches Chrome to the tab with the given URL (exact match first,
 * then hostname fallback). Also brings the window to the front.
 */
async function focusTab(url) {
  if (!url) return;
  const allTabs = await chrome.tabs.query({});
  const currentWindow = await chrome.windows.getCurrent();

  // Try exact URL match first
  let matches = allTabs.filter(t => t.url === url);

  // Fall back to hostname match
  if (matches.length === 0) {
    try {
      const targetHost = new URL(url).hostname;
      matches = allTabs.filter(t => {
        try { return new URL(t.url).hostname === targetHost; }
        catch { return false; }
      });
    } catch {}
  }

  if (matches.length === 0) return;

  // Prefer a match in a different window so it actually switches windows
  const match = matches.find(t => t.windowId !== currentWindow.id) || matches[0];
  await chrome.tabs.update(match.id, { active: true });
  await chrome.windows.update(match.windowId, { focused: true });
}

/**
 * closeDuplicateTabs(urls, keepOne)
 *
 * Closes duplicate tabs for the given list of URLs.
 * keepOne=true → keep one copy of each, close the rest.
 * keepOne=false → close all copies.
 */
async function closeDuplicateTabs(urls, keepOne = true) {
  const allTabs = await chrome.tabs.query({});
  const toClose = [];

  for (const url of urls) {
    const matching = allTabs.filter(t => t.url === url);
    if (keepOne) {
      const keep = matching.find(t => t.active) || matching[0];
      for (const tab of matching) {
        if (tab.id !== keep.id) toClose.push(tab.id);
      }
    } else {
      for (const tab of matching) toClose.push(tab.id);
    }
  }

  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}

/**
 * closeTabOutDupes()
 *
 * Closes all duplicate Abas Cientistas new-tab pages except the current one.
 */
async function closeTabOutDupes() {
  const extensionId = chrome.runtime.id;
  const newtabUrl = `chrome-extension://${extensionId}/index.html`;

  const allTabs = await chrome.tabs.query({});
  const currentWindow = await chrome.windows.getCurrent();
  const tabOutTabs = allTabs.filter(t =>
    t.url === newtabUrl || t.url === 'chrome://newtab/'
  );

  if (tabOutTabs.length <= 1) return;

  // Keep the active Abas Cientistas tab in the CURRENT window — that's the one the
  // user is looking at right now. Falls back to any active one, then the first.
  const keep =
    tabOutTabs.find(t => t.active && t.windowId === currentWindow.id) ||
    tabOutTabs.find(t => t.active) ||
    tabOutTabs[0];
  const toClose = tabOutTabs.filter(t => t.id !== keep.id).map(t => t.id);
  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}


/* ----------------------------------------------------------------
   SAVED FOR LATER — chrome.storage.local

   Replaces the old server-side SQLite + REST API with Chrome's
   built-in key-value storage. Data persists across browser sessions
   and doesn't require a running server.

   Data shape stored under the "deferred" key:
   [
     {
       id: "1712345678901",          // timestamp-based unique ID
       url: "https://example.com",
       title: "Example Page",
       savedAt: "2026-04-04T10:00:00.000Z",  // ISO date string
       completed: false,             // true = checked off (archived)
       dismissed: false              // true = dismissed without reading
     },
     ...
   ]
   ---------------------------------------------------------------- */

/**
 * saveTabForLater(tab)
 *
 * Saves a single tab to the "Saved for Later" list in chrome.storage.local.
 * @param {{ url: string, title: string }} tab
 */
async function saveTabForLater(tab) {
  const { deferred = [] } = await chrome.storage.local.get('deferred');
  deferred.push({
    id:        Date.now().toString(),
    url:       tab.url,
    title:     tab.title,
    savedAt:   new Date().toISOString(),
    completed: false,
    dismissed: false,
  });
  await chrome.storage.local.set({ deferred });
}

/**
 * getSavedTabs()
 *
 * Returns all saved tabs from chrome.storage.local.
 * Filters out dismissed items (those are gone for good).
 * Splits into active (not completed) and archived (completed).
 */
async function getSavedTabs() {
  const { deferred = [] } = await chrome.storage.local.get('deferred');
  const visible = deferred.filter(t => !t.dismissed);
  return {
    active:   visible.filter(t => !t.completed),
    archived: visible.filter(t => t.completed),
  };
}

/**
 * checkOffSavedTab(id)
 *
 * Marks a saved tab as completed (checked off). It moves to the archive.
 */
async function checkOffSavedTab(id) {
  const { deferred = [] } = await chrome.storage.local.get('deferred');
  const tab = deferred.find(t => t.id === id);
  if (tab) {
    tab.completed = true;
    tab.completedAt = new Date().toISOString();
    await chrome.storage.local.set({ deferred });
  }
}

/**
 * dismissSavedTab(id)
 *
 * Marks a saved tab as dismissed (removed from all lists).
 */
async function dismissSavedTab(id) {
  const { deferred = [] } = await chrome.storage.local.get('deferred');
  const tab = deferred.find(t => t.id === id);
  if (tab) {
    tab.dismissed = true;
    await chrome.storage.local.set({ deferred });
  }
}


/* ----------------------------------------------------------------
   UI HELPERS
   ---------------------------------------------------------------- */

/**
 * playCloseSound()
 *
 * Plays a clean "swoosh" sound when tabs are closed.
 * Built entirely with the Web Audio API — no sound files needed.
 * A filtered noise sweep that descends in pitch, like air moving.
 */
function playCloseSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;

    // Swoosh: shaped white noise through a sweeping bandpass filter
    const duration = 0.25;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate noise with a natural envelope (quick attack, smooth decay)
    for (let i = 0; i < data.length; i++) {
      const pos = i / data.length;
      // Envelope: ramps up fast in first 10%, then fades out smoothly
      const env = pos < 0.1 ? pos / 0.1 : Math.pow(1 - (pos - 0.1) / 0.9, 1.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter sweeps from high to low — creates the "swoosh" character
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.0;
    filter.frequency.setValueAtTime(4000, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + duration);

    // Volume
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(t);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not supported — fail silently
  }
}

/**
 * shootConfetti(x, y)
 *
 * Shoots a burst of colorful confetti particles from the given screen
 * coordinates (typically the center of a card being closed).
 * Pure CSS + JS, no libraries.
 */
function shootConfetti(x, y) {
  const colors = [
    '#c8713a', // amber
    '#e8a070', // amber light
    '#5a7a62', // sage
    '#8aaa92', // sage light
    '#5a6b7a', // slate
    '#8a9baa', // slate light
    '#d4b896', // warm paper
    '#b35a5a', // rose
  ];

  const particleCount = 17;

  for (let i = 0; i < particleCount; i++) {
    const el = document.createElement('div');

    const isCircle = Math.random() > 0.5;
    const size = 5 + Math.random() * 6; // 5–11px
    const color = colors[Math.floor(Math.random() * colors.length)];

    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${isCircle ? '50%' : '2px'};
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      opacity: 1;
    `;
    document.body.appendChild(el);

    // Physics: random angle and speed for the outward burst
    const angle   = Math.random() * Math.PI * 2;
    const speed   = 60 + Math.random() * 120;
    const vx      = Math.cos(angle) * speed;
    const vy      = Math.sin(angle) * speed - 80; // bias upward
    const gravity = 200;

    const startTime = performance.now();
    const duration  = 700 + Math.random() * 200; // 700–900ms

    function frame(now) {
      const elapsed  = (now - startTime) / 1000;
      const progress = elapsed / (duration / 1000);

      if (progress >= 1) { el.remove(); return; }

      const px = vx * elapsed;
      const py = vy * elapsed + 0.5 * gravity * elapsed * elapsed;
      const opacity = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;
      const rotate  = elapsed * 200 * (isCircle ? 0 : 1);

      el.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${rotate}deg)`;
      el.style.opacity = opacity;

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }
}

/**
 * animateCardOut(card)
 *
 * Smoothly removes a mission card: fade + scale down, then confetti.
 * After the animation, checks if the grid is now empty.
 */
function animateCardOut(card) {
  if (!card) return;

  const rect = card.getBoundingClientRect();
  shootConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

  card.classList.add('closing');
  setTimeout(() => {
    card.remove();
    checkAndShowEmptyState();
  }, 300);
}

/**
 * showToast(message)
 *
 * Brief pop-up notification at the bottom of the screen.
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('abas-cientistas-theme', nextTheme);

  document.querySelectorAll('[data-action="set-theme"]').forEach(button => {
    const isActive = button.dataset.themeValue === nextTheme;
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function initTheme() {
  applyTheme(localStorage.getItem('abas-cientistas-theme') || 'light');
}

/**
 * checkAndShowEmptyState()
 *
 * Shows a cheerful "Inbox zero" message when all domain cards are gone.
 */
function checkAndShowEmptyState() {
  const missionsEl = document.getElementById('openTabsMissions');
  if (!missionsEl) return;

  const remaining = missionsEl.querySelectorAll('.mission-card:not(.closing)').length;
  if (remaining > 0) return;

  missionsEl.innerHTML = `
    <div class="missions-empty-state">
      <div class="empty-checkmark">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <div class="empty-title">Fila limpa.</div>
      <div class="empty-subtitle">Nenhuma aba de projeto, código ou pesquisa pendente por agora.</div>
    </div>
  `;

  const countEl = document.getElementById('openTabsSectionCount');
  if (countEl) countEl.textContent = '0 grupos';
}

function renderExtensionOnlyState() {
  const openTabsSection      = document.getElementById('openTabsSection');
  const openTabsMissionsEl   = document.getElementById('openTabsMissions');
  const openTabsSectionCount = document.getElementById('openTabsSectionCount');
  const openTabsSectionTitle = document.getElementById('openTabsSectionTitle');
  const workspaceSidebar     = document.getElementById('workspaceSidebar');
  const focusPanel           = document.getElementById('focusPanel');
  const cleanupPanel         = document.getElementById('cleanupPanel');
  const statusSummary        = document.getElementById('statusSummary');
  const dashboardColumns     = document.getElementById('dashboardColumns');

  if (!openTabsSection || !openTabsMissionsEl) return;
  if (dashboardColumns) dashboardColumns.classList.add('no-live-data');
  if (workspaceSidebar) workspaceSidebar.style.display = 'none';
  if (focusPanel) focusPanel.style.display = 'none';
  if (cleanupPanel) cleanupPanel.style.display = 'none';
  if (statusSummary) statusSummary.innerHTML = '<span>Instale como extensão para ler abas reais</span>';

  if (openTabsSectionTitle) openTabsSectionTitle.textContent = 'Instale como extensão';
  if (openTabsSectionCount) openTabsSectionCount.textContent = '0 abas lidas';
  openTabsMissionsEl.innerHTML = `
    <div class="missions-empty-state">
      <div class="empty-checkmark">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25 6.75 6.75m0 0v4.5m0-4.5h4.5m1.5 6 4.5 4.5m0 0v-4.5m0 4.5h-4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div class="empty-title">Esta página foi aberta como arquivo.</div>
      <div class="empty-subtitle">
        Para ler suas abas reais, carregue a pasta <strong>extension</strong> em <strong>chrome://extensions</strong> e recarregue a extensão Abas Cientistas.
      </div>
    </div>
  `;
  openTabsSection.style.display = 'block';
}

/**
 * timeAgo(dateStr)
 *
 * Converts an ISO date string into a human-friendly relative time.
 * "2026-04-04T10:00:00Z" → "há 2 h" or "ontem"
 */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr);
  const now  = new Date();
  const diffMins  = Math.floor((now - then) / 60000);
  const diffHours = Math.floor((now - then) / 3600000);
  const diffDays  = Math.floor((now - then) / 86400000);

  if (diffMins < 1)   return 'agora';
  if (diffMins < 60)  return 'há ' + diffMins + ' min';
  if (diffHours < 24) return 'há ' + diffHours + ' h';
  if (diffDays === 1) return 'ontem';
  return 'há ' + diffDays + ' dias';
}

/**
 * getGreeting() — "Bom dia / Boa tarde / Boa noite"
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia, cientista';
  if (hour < 17) return 'Boa tarde, cientista';
  return 'Boa noite, cientista';
}

/**
 * getDateDisplay() — "sexta-feira, 4 de abril de 2026"
 */
function getDateDisplay() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}


/* ----------------------------------------------------------------
   DOMAIN & TITLE CLEANUP HELPERS
   ---------------------------------------------------------------- */

// Map of known hostnames → friendly display names.
const FRIENDLY_DOMAINS = {
  'github.com':           'GitHub',
  'www.github.com':       'GitHub',
  'gist.github.com':      'GitHub Gist',
  'youtube.com':          'YouTube',
  'www.youtube.com':      'YouTube',
  'music.youtube.com':    'YouTube Music',
  'x.com':                'X',
  'www.x.com':            'X',
  'twitter.com':          'X',
  'www.twitter.com':      'X',
  'reddit.com':           'Reddit',
  'www.reddit.com':       'Reddit',
  'old.reddit.com':       'Reddit',
  'substack.com':         'Substack',
  'www.substack.com':     'Substack',
  'medium.com':           'Medium',
  'www.medium.com':       'Medium',
  'linkedin.com':         'LinkedIn',
  'www.linkedin.com':     'LinkedIn',
  'stackoverflow.com':    'Stack Overflow',
  'www.stackoverflow.com':'Stack Overflow',
  'news.ycombinator.com': 'Hacker News',
  'google.com':           'Google',
  'www.google.com':       'Google',
  'mail.google.com':      'Gmail',
  'docs.google.com':      'Google Docs',
  'drive.google.com':     'Google Drive',
  'calendar.google.com':  'Google Calendar',
  'meet.google.com':      'Google Meet',
  'gemini.google.com':    'Gemini',
  'chatgpt.com':          'ChatGPT',
  'www.chatgpt.com':      'ChatGPT',
  'chat.openai.com':      'ChatGPT',
  'claude.ai':            'Claude',
  'www.claude.ai':        'Claude',
  'code.claude.com':      'Claude Code',
  'notion.so':            'Notion',
  'www.notion.so':        'Notion',
  'figma.com':            'Figma',
  'www.figma.com':        'Figma',
  'slack.com':            'Slack',
  'app.slack.com':        'Slack',
  'discord.com':          'Discord',
  'www.discord.com':      'Discord',
  'wikipedia.org':        'Wikipedia',
  'en.wikipedia.org':     'Wikipedia',
  'amazon.com':           'Amazon',
  'www.amazon.com':       'Amazon',
  'netflix.com':          'Netflix',
  'www.netflix.com':      'Netflix',
  'spotify.com':          'Spotify',
  'open.spotify.com':     'Spotify',
  'vercel.com':           'Vercel',
  'www.vercel.com':       'Vercel',
  'npmjs.com':            'npm',
  'www.npmjs.com':        'npm',
  'developer.mozilla.org':'MDN',
  'arxiv.org':            'arXiv',
  'www.arxiv.org':        'arXiv',
  'scholar.google.com':    'Google Scholar',
  'colab.research.google.com':'Google Colab',
  'kaggle.com':           'Kaggle',
  'www.kaggle.com':       'Kaggle',
  'paperswithcode.com':   'Papers with Code',
  'openreview.net':       'OpenReview',
  'www.semanticscholar.org':'Semantic Scholar',
  'semantic-scholar.org': 'Semantic Scholar',
  'observablehq.com':     'Observable',
  'www.observablehq.com': 'Observable',
  'databricks.com':       'Databricks',
  'www.databricks.com':   'Databricks',
  'supabase.com':         'Supabase',
  'www.supabase.com':     'Supabase',
  'railway.app':          'Railway',
  'www.railway.app':      'Railway',
  'huggingface.co':       'Hugging Face',
  'www.huggingface.co':   'Hugging Face',
  'producthunt.com':      'Product Hunt',
  'www.producthunt.com':  'Product Hunt',
  'xiaohongshu.com':      'RedNote',
  'www.xiaohongshu.com':  'RedNote',
  'local-files':          'Arquivos locais',
};

function friendlyDomain(hostname) {
  if (!hostname) return '';
  if (FRIENDLY_DOMAINS[hostname]) return FRIENDLY_DOMAINS[hostname];

  if (hostname.endsWith('.substack.com') && hostname !== 'substack.com') {
    return capitalize(hostname.replace('.substack.com', '')) + "'s Substack";
  }
  if (hostname.endsWith('.github.io')) {
    return capitalize(hostname.replace('.github.io', '')) + ' (GitHub Pages)';
  }

  let clean = hostname
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|io|co|ai|dev|app|so|me|xyz|info|us|uk|co\.uk|co\.jp)$/, '');

  return clean.split('.').map(part => capitalize(part)).join(' ');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function stripTitleNoise(title) {
  if (!title) return '';
  // Strip leading notification count: "(2) Title"
  title = title.replace(/^\(\d+\+?\)\s*/, '');
  // Strip inline counts like "Inbox (16,359)"
  title = title.replace(/\s*\([\d,]+\+?\)\s*/g, ' ');
  // Strip email addresses (privacy + cleaner display)
  title = title.replace(/\s*[\-\u2010-\u2015]\s*[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '');
  title = title.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '');
  // Clean X/Twitter format
  title = title.replace(/\s+on X:\s*/, ': ');
  title = title.replace(/\s*\/\s*X\s*$/, '');
  return title.trim();
}

function cleanTitle(title, hostname) {
  if (!title || !hostname) return title || '';

  const friendly = friendlyDomain(hostname);
  const domain   = hostname.replace(/^www\./, '');
  const seps     = [' - ', ' | ', ' — ', ' · ', ' – '];

  for (const sep of seps) {
    const idx = title.lastIndexOf(sep);
    if (idx === -1) continue;
    const suffix     = title.slice(idx + sep.length).trim();
    const suffixLow  = suffix.toLowerCase();
    if (
      suffixLow === domain.toLowerCase() ||
      suffixLow === friendly.toLowerCase() ||
      suffixLow === domain.replace(/\.\w+$/, '').toLowerCase() ||
      domain.toLowerCase().includes(suffixLow) ||
      friendly.toLowerCase().includes(suffixLow)
    ) {
      const cleaned = title.slice(0, idx).trim();
      if (cleaned.length >= 5) return cleaned;
    }
  }
  return title;
}

function smartTitle(title, url) {
  if (!url) return title || '';
  let pathname = '', hostname = '';
  try { const u = new URL(url); pathname = u.pathname; hostname = u.hostname; }
  catch { return title || ''; }

  const titleIsUrl = !title || title === url || title.startsWith(hostname) || title.startsWith('http');

  if ((hostname === 'x.com' || hostname === 'twitter.com' || hostname === 'www.x.com') && pathname.includes('/status/')) {
    const username = pathname.split('/')[1];
    if (username) return titleIsUrl ? `Post by @${username}` : title;
  }

  if (hostname === 'github.com' || hostname === 'www.github.com') {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const [owner, repo, ...rest] = parts;
      if (rest[0] === 'issues' && rest[1]) return `${owner}/${repo} Issue #${rest[1]}`;
      if (rest[0] === 'pull'   && rest[1]) return `${owner}/${repo} PR #${rest[1]}`;
      if (rest[0] === 'blob' || rest[0] === 'tree') return `${owner}/${repo} — ${rest.slice(2).join('/')}`;
      if (titleIsUrl) return `${owner}/${repo}`;
    }
  }

  if ((hostname === 'www.youtube.com' || hostname === 'youtube.com') && pathname === '/watch') {
    if (titleIsUrl) return 'YouTube Video';
  }

  if ((hostname === 'www.reddit.com' || hostname === 'reddit.com' || hostname === 'old.reddit.com') && pathname.includes('/comments/')) {
    const parts  = pathname.split('/').filter(Boolean);
    const subIdx = parts.indexOf('r');
    if (subIdx !== -1 && parts[subIdx + 1]) {
      if (titleIsUrl) return `r/${parts[subIdx + 1]} post`;
    }
  }

  return title || url;
}


/* ----------------------------------------------------------------
   SVG ICON STRINGS
   ---------------------------------------------------------------- */
const ICONS = {
  tabs:    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18" /></svg>`,
  close:   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`,
  archive: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>`,
  focus:   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" /></svg>`,
};


/* ----------------------------------------------------------------
   IN-MEMORY STORE FOR OPEN-TAB GROUPS
   ---------------------------------------------------------------- */
let domainGroups = [];
let activeGroupFilter = 'all';
let activeSearchQuery = '';

const TAB_STATUS = {
  code:    { label: 'Codar', className: 'status-code', score: 95 },
  execute: { label: 'Executar', className: 'status-execute', score: 88 },
  respond: { label: 'Responder', className: 'status-respond', score: 84 },
  read:    { label: 'Ler', className: 'status-read', score: 76 },
  watch:   { label: 'Assistir', className: 'status-watch', score: 58 },
  review:  { label: 'Revisar', className: 'status-review', score: 68 },
  close:   { label: 'Fechar provável', className: 'status-close', score: 30 },
};


/* ----------------------------------------------------------------
   HELPER: filter out browser-internal pages
   ---------------------------------------------------------------- */

/**
 * getRealTabs()
 *
 * Returns tabs that are real web pages — no chrome://, extension
 * pages, about:blank, etc.
 */
function getRealTabs() {
  return openTabs.filter(t => {
    const url = t.url || '';
    return (
      !url.startsWith('chrome://') &&
      !url.startsWith('chrome-extension://') &&
      !url.startsWith('about:') &&
      !url.startsWith('edge://') &&
      !url.startsWith('brave://')
    );
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getGroupKey(group) {
  return group.groupKey || group.domain;
}

function getGroupConfig(groupKey) {
  return DATA_SCIENCE_GROUPS.find(group => group.groupKey === groupKey) || null;
}

function parseTabUrl(tab) {
  try { return new URL(tab.url || ''); }
  catch { return null; }
}

function getTabHostname(tab) {
  const parsed = parseTabUrl(tab);
  return parsed ? parsed.hostname : '';
}

function isLocalDevelopment(tab) {
  const parsed = parseTabUrl(tab);
  if (!parsed) return false;
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname) || parsed.hostname.endsWith('.local');
}

function detectTabStatus(tab, groupKey = '') {
  const parsed = parseTabUrl(tab);
  const hostname = normalizeForMatch(parsed ? parsed.hostname : '');
  const pathname = normalizeForMatch(parsed ? parsed.pathname : '');
  const text = normalizeForMatch(`${hostname} ${pathname} ${tab.title || ''}`);

  if (
    isLocalDevelopment(tab) ||
    pathname.includes('/pull/') ||
    pathname.includes('/issues/') ||
    text.includes('traceback') ||
    text.includes('error') ||
    text.includes('exception') ||
    text.includes('debug')
  ) return TAB_STATUS.code;

  if (
    groupKey === 'ds-deploy' ||
    text.includes('deploy') ||
    text.includes('build') ||
    text.includes('logs') ||
    text.includes('dashboard') ||
    text.includes('database')
  ) return TAB_STATUS.execute;

  if (
    groupKey === 'ds-messaging' ||
    hostname.includes('mail.google') ||
    hostname.includes('slack') ||
    hostname.includes('whatsapp') ||
    hostname.includes('discord') ||
    hostname.includes('teams')
  ) return TAB_STATUS.respond;

  if (
    groupKey === 'ds-papers' ||
    hostname.includes('arxiv') ||
    hostname.includes('openreview') ||
    hostname.includes('scholar') ||
    text.includes('paper') ||
    text.includes('preprint')
  ) return TAB_STATUS.read;

  if (
    groupKey === 'ds-talks' ||
    groupKey === 'ds-youtube' ||
    hostname.includes('youtube') ||
    hostname.includes('coursera') ||
    hostname.includes('udemy') ||
    hostname.includes('edx')
  ) return TAB_STATUS.watch;

  if (groupKey === 'ds-shorts' || text.includes('shorts') || text.includes('reels') || text.includes('tiktok')) {
    return TAB_STATUS.close;
  }

  if (groupKey === 'ds-ai' || groupKey === 'ds-notebooks' || groupKey === 'ds-apps') return TAB_STATUS.review;
  return TAB_STATUS.review;
}

function getTabLabel(tab, groupDomain = '') {
  let label = cleanTitle(smartTitle(stripTitleNoise(tab.title || ''), tab.url), groupDomain);
  try {
    const parsed = new URL(tab.url);
    if (parsed.hostname === 'localhost' && parsed.port) label = `${parsed.port} ${label}`;
  } catch {}
  return label || tab.url || 'Aba sem título';
}

function tabMatchesSearch(tab, query, groupLabel = '') {
  if (!query) return true;
  const haystack = normalizeForMatch(`${tab.title || ''} ${tab.url || ''} ${groupLabel}`);
  return haystack.includes(normalizeForMatch(query));
}

function getFilteredGroups(groups) {
  return groups
    .filter(group => activeGroupFilter === 'all' || getGroupKey(group) === activeGroupFilter)
    .map(group => ({
      ...group,
      tabs: (group.tabs || []).filter(tab => tabMatchesSearch(tab, activeSearchQuery, group.label || friendlyDomain(group.domain))),
    }))
    .filter(group => group.tabs.length > 0);
}

function getDuplicateUrlEntries(tabs) {
  const counts = {};
  for (const tab of tabs) {
    if (!tab.url) continue;
    counts[tab.url] = (counts[tab.url] || 0) + 1;
  }
  return Object.entries(counts).filter(([, count]) => count > 1);
}

function scoreFocusTab(tab, groupKey = '') {
  const status = detectTabStatus(tab, groupKey);
  const parsed = parseTabUrl(tab);
  const text = normalizeForMatch(`${parsed ? parsed.hostname : ''} ${parsed ? parsed.pathname : ''} ${tab.title || ''}`);
  let score = status.score;
  if (tab.active) score += 20;
  if (text.includes('pull') || text.includes('issue') || text.includes('error') || text.includes('deadline')) score += 12;
  if (text.includes('paper') || text.includes('arxiv') || text.includes('benchmark')) score += 8;
  if (groupKey === 'ds-shorts') score -= 24;
  return score;
}

function buildCleanupInsights(realTabs, groups) {
  const insights = [];
  const duplicateEntries = getDuplicateUrlEntries(realTabs);
  const duplicateExtras = duplicateEntries.reduce((sum, [, count]) => sum + count - 1, 0);

  if (duplicateExtras > 0) {
    insights.push({
      tone: 'warning',
      title: `${duplicateExtras} aba${duplicateExtras !== 1 ? 's' : ''} duplicada${duplicateExtras !== 1 ? 's' : ''}`,
      detail: 'Dá para manter uma cópia de cada URL e reduzir ruído imediatamente.',
      action: 'dedup',
      urls: duplicateEntries.map(([url]) => url),
    });
  }

  if (realTabs.length >= 35) {
    insights.push({
      tone: 'danger',
      title: `${realTabs.length} abas abertas`,
      detail: 'Sessão muito carregada. Priorize foco, pesquisa e execução antes de abrir mais contexto.',
      action: 'none',
    });
  }

  const groupByKey = Object.fromEntries(groups.map(group => [getGroupKey(group), group]));
  const shortsCount = groupByKey['ds-shorts'] ? groupByKey['ds-shorts'].tabs.length : 0;
  if (shortsCount >= 2) {
    insights.push({
      tone: 'warning',
      title: `${shortsCount} curtos abertos`,
      detail: 'Bom para inspiração rápida, ruim para foco profundo. Vale revisar e fechar.',
      action: 'filter',
      groupKey: 'ds-shorts',
    });
  }

  const messagingCount = groupByKey['ds-messaging'] ? groupByKey['ds-messaging'].tabs.length : 0;
  if (messagingCount >= 4) {
    insights.push({
      tone: 'info',
      title: `${messagingCount} abas de mensageria`,
      detail: 'Separe um bloco para responder e depois volte ao código/pesquisa.',
      action: 'filter',
      groupKey: 'ds-messaging',
    });
  }

  const codeCount = (groupByKey['ds-code'] ? groupByKey['ds-code'].tabs.length : 0) + (groupByKey['ds-github'] ? groupByKey['ds-github'].tabs.length : 0);
  if (codeCount >= 8) {
    insights.push({
      tone: 'info',
      title: `${codeCount} abas de código/GitHub`,
      detail: 'Há trabalho ativo suficiente para consolidar por repo, issue ou PR.',
      action: 'filter',
      groupKey: 'ds-github',
    });
  }

  const localhostCount = realTabs.filter(isLocalDevelopment).length;
  if (localhostCount >= 3) {
    insights.push({
      tone: 'info',
      title: `${localhostCount} ambientes locais`,
      detail: 'Confira portas e projetos para evitar testar a tela errada.',
      action: 'filter',
      groupKey: 'ds-code',
    });
  }

  return insights.slice(0, 5);
}

/**
 * checkTabOutDupes()
 *
 * Counts how many Abas Cientistas pages are open. If more than 1,
 * shows a banner offering to close the extras.
 */
function checkTabOutDupes() {
  const tabOutTabs = openTabs.filter(t => t.isTabOut);
  const banner  = document.getElementById('tabOutDupeBanner');
  const countEl = document.getElementById('tabOutDupeCount');
  if (!banner) return;

  if (tabOutTabs.length > 1) {
    if (countEl) countEl.textContent = tabOutTabs.length;
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

function renderWorkspaceSidebar(groups, realTabs, cleanupItems) {
  const sidebar = document.getElementById('workspaceSidebar');
  if (!sidebar) return;

  if (!canReadChromeTabs || groups.length === 0) {
    sidebar.style.display = 'none';
    return;
  }

  const counts = {};
  for (const group of groups) counts[getGroupKey(group)] = (group.tabs || []).length;

  const buttons = [
    `<button class="group-nav-item ${activeGroupFilter === 'all' ? 'active' : ''}" data-action="filter-group" data-group-key="all">
      <span class="group-nav-icon">ALL</span>
      <span class="group-nav-text">Todos</span>
      <span class="group-nav-count">${realTabs.length}</span>
    </button>`,
    ...DATA_SCIENCE_GROUPS
      .filter(group => counts[group.groupKey])
      .map(group => `
        <button class="group-nav-item ${activeGroupFilter === group.groupKey ? 'active' : ''}" data-action="filter-group" data-group-key="${group.groupKey}">
          <span class="group-nav-icon">${escapeHtml(group.groupIcon || group.groupShort || 'DS')}</span>
          <span class="group-nav-text">${escapeHtml(group.groupShort || group.groupLabel)}</span>
          <span class="group-nav-count">${counts[group.groupKey]}</span>
        </button>`)
  ].join('');

  sidebar.innerHTML = `
    <div class="sidebar-title">Workspace</div>
    <div class="group-nav">${buttons}</div>
    <div class="sidebar-footnote">${cleanupItems.length} alerta${cleanupItems.length !== 1 ? 's' : ''} de organização</div>
  `;
  sidebar.style.display = 'block';
}

function renderStatusSummary(realTabs) {
  const summary = document.getElementById('statusSummary');
  if (!summary) return;

  if (!canReadChromeTabs) {
    summary.innerHTML = '<span>Extensão não carregada</span>';
    return;
  }

  const statusCounts = {};
  for (const group of domainGroups) {
    for (const tab of group.tabs || []) {
      const status = detectTabStatus(tab, getGroupKey(group));
      statusCounts[status.label] = (statusCounts[status.label] || 0) + 1;
    }
  }

  const top = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `<span>${count} ${escapeHtml(label)}</span>`)
    .join('');

  summary.innerHTML = top || `<span>${realTabs.length} abas organizadas</span>`;
}

function renderFocusPanel(realTabs, groups) {
  const panel = document.getElementById('focusPanel');
  if (!panel) return;

  if (!canReadChromeTabs || realTabs.length === 0) {
    panel.style.display = 'none';
    return;
  }

  const candidates = [];
  for (const group of groups) {
    const groupKey = getGroupKey(group);
    for (const tab of group.tabs || []) {
      candidates.push({ tab, groupKey, groupLabel: group.label || friendlyDomain(group.domain) });
    }
  }

  const focusTabs = candidates
    .sort((a, b) => scoreFocusTab(b.tab, b.groupKey) - scoreFocusTab(a.tab, a.groupKey))
    .slice(0, 4);

  const items = focusTabs.map(({ tab, groupKey, groupLabel }) => {
    const status = detectTabStatus(tab, groupKey);
    const label = getTabLabel(tab, groupKey);
    const safeUrl = escapeHtml(tab.url || '');
    const safeTitle = escapeHtml(label);
    const hostname = getTabHostname(tab);
    const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=16` : '';

    return `
      <div class="focus-item">
        ${faviconUrl ? `<img class="focus-favicon" src="${faviconUrl}" alt="" onerror="this.style.display='none'">` : ''}
        <div class="focus-info">
          <button class="focus-title" data-action="focus-tab" data-tab-url="${safeUrl}" title="${safeTitle}">${safeTitle}</button>
          <div class="focus-meta">
            <span>${escapeHtml(groupLabel)}</span>
            <span class="tab-status-pill ${status.className}">${status.label}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="panel-header">
      <h2>Foco agora</h2>
      <span>${focusTabs.length}</span>
    </div>
    <div class="focus-list">${items}</div>
  `;
  panel.style.display = 'block';
}

function renderCleanupPanel(cleanupItems) {
  const panel = document.getElementById('cleanupPanel');
  if (!panel) return;

  if (!canReadChromeTabs || cleanupItems.length === 0) {
    panel.style.display = 'none';
    return;
  }

  const items = cleanupItems.map(item => {
    let actionHtml = '';
    if (item.action === 'dedup') {
      const urls = (item.urls || []).map(url => encodeURIComponent(url)).join(',');
      actionHtml = `<button class="cleanup-action" data-action="dedup-keep-one" data-dupe-urls="${urls}">Resolver</button>`;
    } else if (item.action === 'filter') {
      actionHtml = `<button class="cleanup-action" data-action="filter-group" data-group-key="${escapeHtml(item.groupKey)}">Ver</button>`;
    }

    return `
      <div class="cleanup-item cleanup-${item.tone}">
        <div>
          <div class="cleanup-title">${escapeHtml(item.title)}</div>
          <div class="cleanup-detail">${escapeHtml(item.detail)}</div>
        </div>
        ${actionHtml}
      </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="panel-header">
      <h2>Limpeza sugerida</h2>
      <span>${cleanupItems.length}</span>
    </div>
    <div class="cleanup-list">${items}</div>
  `;
  panel.style.display = 'block';
}


/* ----------------------------------------------------------------
   OVERFLOW CHIPS ("+N more" expand button in domain cards)
   ---------------------------------------------------------------- */

function buildOverflowChips(hiddenTabs, urlCounts = {}, group = {}) {
  const groupKey = getGroupKey(group);
  const hiddenChips = hiddenTabs.map(tab => {
    const label    = getTabLabel(tab, group.domain || '');
    const status   = detectTabStatus(tab, groupKey);
    const count    = urlCounts[tab.url] || 1;
    const dupeTag  = count > 1 ? ` <span class="chip-dupe-badge">(${count}x)</span>` : '';
    const chipClass = count > 1 ? ' chip-has-dupes' : '';
    const safeUrl   = escapeHtml(tab.url || '');
    const safeTitle = escapeHtml(label);
    let domain = '';
    try { domain = new URL(tab.url).hostname; } catch {}
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : '';
    return `<div class="page-chip clickable${chipClass}" data-action="focus-tab" data-tab-url="${safeUrl}" title="${safeTitle}">
      ${faviconUrl ? `<img class="chip-favicon" src="${faviconUrl}" alt="" onerror="this.style.display='none'">` : ''}
      <span class="chip-text">${safeTitle}</span>${dupeTag}
      <span class="tab-status-pill ${status.className}">${status.label}</span>
      <div class="chip-actions">
        <button class="chip-action chip-save" data-action="defer-single-tab" data-tab-url="${safeUrl}" data-tab-title="${safeTitle}" title="Revisar depois">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
        </button>
        <button class="chip-action chip-close" data-action="close-single-tab" data-tab-url="${safeUrl}" title="Fechar esta aba">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="page-chips-overflow" style="display:none">${hiddenChips}</div>
    <div class="page-chip page-chip-overflow clickable" data-action="expand-chips">
      <span class="chip-text">+${hiddenTabs.length} mais</span>
    </div>`;
}


/* ----------------------------------------------------------------
   DOMAIN CARD RENDERER
   ---------------------------------------------------------------- */

/**
 * renderDomainCard(group, groupIndex)
 *
 * Builds the HTML for one domain group card.
 * group = { domain: string, tabs: [{ url, title, id, windowId, active }] }
 */
function renderDomainCard(group) {
  const tabs      = group.tabs || [];
  const tabCount  = tabs.length;
  const isLanding = group.domain === '__landing-pages__';
  const stableId  = 'domain-' + group.domain.replace(/[^a-z0-9]/g, '-');
  const groupKey  = getGroupKey(group);
  const groupConfig = getGroupConfig(groupKey);
  const groupTitle = isLanding ? 'Portais de entrada' : (group.label || friendlyDomain(group.domain));

  // Count duplicates (exact URL match)
  const urlCounts = {};
  for (const tab of tabs) urlCounts[tab.url] = (urlCounts[tab.url] || 0) + 1;
  const dupeUrls   = Object.entries(urlCounts).filter(([, c]) => c > 1);
  const hasDupes   = dupeUrls.length > 0;
  const totalExtras = dupeUrls.reduce((s, [, c]) => s + c - 1, 0);

  const tabLabel = tabCount === 1 ? 'aba aberta' : 'abas abertas';
  const tabBadge = `<span class="open-tabs-badge">
    ${ICONS.tabs}
    ${tabCount} ${tabLabel}
  </span>`;

  const dupeBadge = hasDupes
    ? `<span class="open-tabs-badge" style="color:var(--accent-amber);background:rgba(200,113,58,0.08);">
        ${totalExtras} duplicada${totalExtras !== 1 ? 's' : ''}
      </span>`
    : '';

  // Deduplicate for display: show each URL once, with (Nx) badge if duped
  const seen = new Set();
  const uniqueTabs = [];
  for (const tab of tabs) {
    if (!seen.has(tab.url)) { seen.add(tab.url); uniqueTabs.push(tab); }
  }

  const visibleTabs = uniqueTabs.slice(0, 8);
  const extraCount  = uniqueTabs.length - visibleTabs.length;

  const pageChips = visibleTabs.map(tab => {
    const label    = getTabLabel(tab, group.domain);
    const status   = detectTabStatus(tab, groupKey);
    const count    = urlCounts[tab.url];
    const dupeTag  = count > 1 ? ` <span class="chip-dupe-badge">(${count}x)</span>` : '';
    const chipClass = count > 1 ? ' chip-has-dupes' : '';
    const safeUrl   = escapeHtml(tab.url || '');
    const safeTitle = escapeHtml(label);
    let domain = '';
    try { domain = new URL(tab.url).hostname; } catch {}
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : '';
    return `<div class="page-chip clickable${chipClass}" data-action="focus-tab" data-tab-url="${safeUrl}" title="${safeTitle}">
      ${faviconUrl ? `<img class="chip-favicon" src="${faviconUrl}" alt="" onerror="this.style.display='none'">` : ''}
      <span class="chip-text">${safeTitle}</span>${dupeTag}
      <span class="tab-status-pill ${status.className}">${status.label}</span>
      <div class="chip-actions">
        <button class="chip-action chip-save" data-action="defer-single-tab" data-tab-url="${safeUrl}" data-tab-title="${safeTitle}" title="Revisar depois">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
        </button>
        <button class="chip-action chip-close" data-action="close-single-tab" data-tab-url="${safeUrl}" title="Fechar esta aba">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>`;
  }).join('') + (extraCount > 0 ? buildOverflowChips(uniqueTabs.slice(8), urlCounts, group) : '');

  let actionsHtml = `
    <button class="action-btn close-tabs" data-action="close-domain-tabs" data-domain-id="${stableId}">
      ${ICONS.close}
      Fechar ${tabCount === 1 ? 'esta aba' : `as ${tabCount} abas`}
    </button>`;

  if (hasDupes) {
    const dupeUrlsEncoded = dupeUrls.map(([url]) => encodeURIComponent(url)).join(',');
    actionsHtml += `
      <button class="action-btn" data-action="dedup-keep-one" data-dupe-urls="${dupeUrlsEncoded}">
        Fechar ${totalExtras} duplicada${totalExtras !== 1 ? 's' : ''}
      </button>`;
  }

  return `
    <div class="mission-card domain-card ${hasDupes ? 'has-amber-bar' : 'has-neutral-bar'}" data-domain-id="${stableId}">
      <div class="status-bar"></div>
      <div class="mission-content">
        <div class="mission-top">
          ${groupConfig ? `<span class="mission-icon">${escapeHtml(groupConfig.groupIcon || groupConfig.groupShort || 'DS')}</span>` : ''}
          <span class="mission-name">${escapeHtml(groupTitle)}</span>
          ${tabBadge}
          ${dupeBadge}
        </div>
        <div class="mission-pages">${pageChips}</div>
        <div class="actions">${actionsHtml}</div>
      </div>
      <div class="mission-meta">
        <div class="mission-page-count">${tabCount}</div>
        <div class="mission-page-label">abas</div>
      </div>
    </div>`;
}


/* ----------------------------------------------------------------
   SAVED FOR LATER — Render Checklist Column
   ---------------------------------------------------------------- */

/**
 * renderDeferredColumn()
 *
 * Reads saved tabs from chrome.storage.local and renders the right-side
 * "Saved for Later" checklist column. Shows active items as a checklist
 * and completed items in a collapsible archive.
 */
async function renderDeferredColumn() {
  const column         = document.getElementById('deferredColumn');
  const list           = document.getElementById('deferredList');
  const empty          = document.getElementById('deferredEmpty');
  const countEl        = document.getElementById('deferredCount');
  const archiveEl      = document.getElementById('deferredArchive');
  const archiveCountEl = document.getElementById('archiveCount');
  const archiveList    = document.getElementById('archiveList');

  if (!column) return;

  try {
    const { active, archived } = await getSavedTabs();

    // Hide the entire column if there's nothing to show
    if (active.length === 0 && archived.length === 0) {
      column.style.display = 'none';
      return;
    }

    column.style.display = 'block';

    // Render active checklist items
    if (active.length > 0) {
      countEl.textContent = `${active.length} item${active.length !== 1 ? 's' : ''}`;
      list.innerHTML = active.map(item => renderDeferredItem(item)).join('');
      list.style.display = 'block';
      empty.style.display = 'none';
    } else {
      list.style.display = 'none';
      countEl.textContent = '';
      empty.style.display = 'block';
    }

    // Render archive section
    if (archived.length > 0) {
      archiveCountEl.textContent = `(${archived.length})`;
      archiveList.innerHTML = archived.map(item => renderArchiveItem(item)).join('');
      archiveEl.style.display = 'block';
    } else {
      archiveEl.style.display = 'none';
    }

  } catch (err) {
    console.warn('[abas-cientistas] Não foi possível carregar itens salvos:', err);
    column.style.display = 'none';
  }
}

/**
 * renderDeferredItem(item)
 *
 * Builds HTML for one active checklist item: checkbox, title link,
 * domain, time ago, dismiss button.
 */
function renderDeferredItem(item) {
  let domain = '';
  try { domain = new URL(item.url).hostname.replace(/^www\./, ''); } catch {}
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  const ago = timeAgo(item.savedAt);

  return `
    <div class="deferred-item" data-deferred-id="${item.id}">
      <input type="checkbox" class="deferred-checkbox" data-action="check-deferred" data-deferred-id="${item.id}">
      <div class="deferred-info">
        <a href="${item.url}" target="_blank" rel="noopener" class="deferred-title" title="${(item.title || '').replace(/"/g, '&quot;')}">
          <img src="${faviconUrl}" alt="" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px" onerror="this.style.display='none'">${item.title || item.url}
        </a>
        <div class="deferred-meta">
          <span>${domain}</span>
          <span>${ago}</span>
        </div>
      </div>
      <button class="deferred-dismiss" data-action="dismiss-deferred" data-deferred-id="${item.id}" title="Remover">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>`;
}

/**
 * renderArchiveItem(item)
 *
 * Builds HTML for one completed/archived item (simpler: just title + date).
 */
function renderArchiveItem(item) {
  const ago = item.completedAt ? timeAgo(item.completedAt) : timeAgo(item.savedAt);
  return `
    <div class="archive-item">
      <a href="${item.url}" target="_blank" rel="noopener" class="archive-item-title" title="${(item.title || '').replace(/"/g, '&quot;')}">
        ${item.title || item.url}
      </a>
      <span class="archive-item-date">${ago}</span>
    </div>`;
}

/* ----------------------------------------------------------------
   DATA SCIENCE GROUPING — opinionated defaults for research/coding work
   ---------------------------------------------------------------- */

const DATA_SCIENCE_GROUPS = [
  {
    groupKey: 'ds-github',
    groupLabel: 'GitHub e versionamento',
    groupShort: 'GitHub',
    groupIcon: 'GH',
    hostnames: ['github.com', 'gist.github.com', 'github.dev'],
    hostIncludes: ['githubusercontent', 'gitlab', 'bitbucket'],
    pathIncludes: ['/pull/', '/issues/', '/commit/', '/actions/', '/compare/'],
    keywords: ['pull request', 'issue', 'commit', 'branch', 'repository', 'repo', 'gist', 'merge', 'review'],
  },
  {
    groupKey: 'ds-code',
    groupLabel: 'Código e documentação',
    groupShort: 'Código',
    groupIcon: '</>',
    hostnames: ['stackoverflow.com', 'developer.mozilla.org', 'docs.python.org', 'pandas.pydata.org', 'numpy.org', 'scikit-learn.org', 'pytorch.org', 'tensorflow.org', 'localhost', '127.0.0.1'],
    hostIncludes: ['readthedocs', 'docs.', 'api.', 'reference', 'storybook', 'localhost'],
    keywords: ['documentation', 'docs', 'api reference', 'sdk', 'typescript', 'python', 'debug', 'error', 'traceback', 'localhost'],
  },
  {
    groupKey: 'ds-notebooks',
    groupLabel: 'Notebooks e experimentos',
    groupShort: 'Experimentos',
    groupIcon: 'NB',
    hostnames: ['colab.research.google.com', 'kaggle.com', 'www.kaggle.com', 'observablehq.com', 'www.observablehq.com'],
    hostIncludes: ['databricks', 'jupyter', 'notebook', 'sagemaker', 'vertex'],
    keywords: ['notebook', 'colab', 'kaggle', 'dataset', 'experiment', 'run', 'training', 'model card', 'benchmark'],
  },
  {
    groupKey: 'ds-deploy',
    groupLabel: 'Deploys, produto e observabilidade',
    groupShort: 'Deploy',
    groupIcon: 'UP',
    hostnames: ['vercel.com', 'www.vercel.com', 'supabase.com', 'www.supabase.com', 'railway.app', 'www.railway.app'],
    hostIncludes: ['netlify', 'render', 'fly.io', 'sentry', 'datadog', 'newrelic', 'grafana', 'metabase', 'lookerstudio'],
    keywords: ['deploy', 'deployment', 'logs', 'monitoring', 'dashboard', 'database', 'build', 'status', 'production'],
  },
  {
    groupKey: 'ds-apps',
    groupLabel: 'Aplicativos e ferramentas',
    groupShort: 'Apps',
    groupIcon: 'AP',
    hostnames: ['huggingface.co', 'notion.so', 'www.notion.so', 'figma.com', 'www.figma.com', 'replit.com', 'codesandbox.io'],
    hostIncludes: ['snowflake', 'airtable', 'linear', 'miro', 'zapier'],
    keywords: ['workspace', 'project', 'app', 'space', 'tool', 'canvas', 'board'],
  },
  {
    groupKey: 'ds-messaging',
    groupLabel: 'Mensageria e coordenação',
    groupShort: 'Mensagens',
    groupIcon: 'DM',
    hostnames: ['mail.google.com', 'web.whatsapp.com', 'app.slack.com', 'discord.com', 'teams.microsoft.com', 'chat.google.com', 'telegram.org'],
    hostIncludes: ['slack', 'whatsapp', 'discord', 'telegram', 'teams', 'trello', 'asana'],
    keywords: ['inbox', 'dm', 'mensagem', 'mensageria', 'chat', 'thread', 'task'],
  },
  {
    groupKey: 'ds-shorts',
    groupLabel: 'Curtos e inspiração rápida',
    groupShort: 'Curtos',
    groupIcon: 'S',
    hostnames: ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'www.tiktok.com', 'www.instagram.com'],
    pathIncludes: ['/shorts/', '/reels/', '/reel/'],
    keywords: ['shorts', 'reels', 'tiktok', 'clip', 'short'],
  },
  {
    groupKey: 'ds-talks',
    groupLabel: 'Palestras, aulas e cursos',
    groupShort: 'Aulas',
    groupIcon: 'ED',
    hostnames: ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'coursera.org', 'www.coursera.org', 'edx.org', 'www.edx.org', 'udemy.com', 'www.udemy.com'],
    hostIncludes: ['deeplearning.ai', 'fast.ai', 'datacamp', 'pluralsight'],
    keywords: ['lecture', 'talk', 'keynote', 'palestra', 'aula', 'curso', 'course', 'tutorial', 'workshop', 'conference'],
  },
  {
    groupKey: 'ds-youtube',
    groupLabel: 'YouTube e vídeos',
    groupShort: 'YouTube',
    groupIcon: 'YT',
    hostnames: ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'],
    keywords: ['youtube', 'watch', 'playlist', 'video'],
  },
  {
    groupKey: 'ds-papers',
    groupLabel: 'Papers e pesquisa',
    groupShort: 'Papers',
    groupIcon: 'PX',
    hostnames: ['arxiv.org', 'scholar.google.com', 'paperswithcode.com', 'openreview.net', 'semantic-scholar.org', 'www.semanticscholar.org'],
    hostIncludes: ['nature', 'science.org', 'acm.org', 'ieee', 'springer', 'elsevier', 'jmlr', 'neurips', 'icml', 'iclr'],
    keywords: ['paper', 'preprint', 'article', 'arxiv', 'benchmark', 'state of the art', 'sota', 'dataset', 'ablation'],
  },
  {
    groupKey: 'ds-ai',
    groupLabel: 'IA e copilotos',
    groupShort: 'IA',
    groupIcon: 'AI',
    hostnames: ['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com', 'claude.ai', 'www.claude.ai', 'gemini.google.com', 'perplexity.ai'],
    hostIncludes: ['openai', 'anthropic', 'cursor', 'v0.dev'],
    keywords: ['prompt', 'assistant', 'copilot', 'agent', 'llm', 'chat'],
  },
];

function normalizeForMatch(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchDataScienceGroup(tab) {
  if (!tab || !tab.url) return null;

  let parsed;
  try { parsed = new URL(tab.url); }
  catch { return null; }

  const hostname = normalizeForMatch(parsed.hostname);
  const pathname = normalizeForMatch(parsed.pathname);
  const haystack = normalizeForMatch(`${parsed.hostname} ${parsed.pathname} ${tab.title || ''}`);

  return DATA_SCIENCE_GROUPS.find(group => {
    const hostnames = (group.hostnames || []).map(normalizeForMatch);
    const hostIncludes = (group.hostIncludes || []).map(normalizeForMatch);
    const pathIncludes = (group.pathIncludes || []).map(normalizeForMatch);
    const keywords = (group.keywords || []).map(normalizeForMatch);

    return (
      hostnames.includes(hostname) ||
      hostIncludes.some(part => hostname.includes(part)) ||
      pathIncludes.some(part => pathname.includes(part)) ||
      keywords.some(word => haystack.includes(word))
    );
  }) || null;
}


/* ----------------------------------------------------------------
   MAIN DASHBOARD RENDERER
   ---------------------------------------------------------------- */

/**
 * renderStaticDashboard()
 *
 * The main render function:
 * 1. Paints greeting + date
 * 2. Fetches open tabs via chrome.tabs.query()
 * 3. Groups tabs by domain (with landing pages pulled out to their own group)
 * 4. Renders domain cards
 * 5. Updates footer stats
 * 6. Renders the "Saved for Later" checklist
 */
async function renderStaticDashboard() {
  // --- Header ---
  const greetingEl = document.getElementById('greeting');
  const dateEl     = document.getElementById('dateDisplay');
  if (greetingEl) greetingEl.textContent = getGreeting();
  if (dateEl)     dateEl.textContent     = getDateDisplay();

  // --- Fetch tabs ---
  await fetchOpenTabs();
  const realTabs = getRealTabs();
  const dashboardColumns = document.getElementById('dashboardColumns');

  if (!canReadChromeTabs) {
    renderExtensionOnlyState();
    const statTabs = document.getElementById('statTabs');
    if (statTabs) statTabs.textContent = '—';
    const statGroups = document.getElementById('statGroups');
    if (statGroups) statGroups.textContent = '—';
    const statCleanup = document.getElementById('statCleanup');
    if (statCleanup) statCleanup.textContent = '—';
    await renderDeferredColumn();
    return;
  }
  if (dashboardColumns) dashboardColumns.classList.remove('no-live-data');

  // --- Group tabs by domain ---
  // Optional landing page rules from config.local.js can still be merged in,
  // but defaults stay focused on data-science workflow categories.
  const LANDING_PAGE_PATTERNS = [
    ...(typeof LOCAL_LANDING_PAGE_PATTERNS !== 'undefined' ? LOCAL_LANDING_PAGE_PATTERNS : []),
  ];

  function isLandingPage(url) {
    try {
      const parsed = new URL(url);
      return LANDING_PAGE_PATTERNS.some(p => {
        // Support both exact hostname and suffix matching (for wildcard subdomains)
        const hostnameMatch = p.hostname
          ? parsed.hostname === p.hostname
          : p.hostnameEndsWith
            ? parsed.hostname.endsWith(p.hostnameEndsWith)
            : false;
        if (!hostnameMatch) return false;
        if (p.test)       return p.test(parsed.pathname, url);
        if (p.pathPrefix) return parsed.pathname.startsWith(p.pathPrefix);
        if (p.pathExact)  return p.pathExact.includes(parsed.pathname);
        return parsed.pathname === '/';
      });
    } catch { return false; }
  }

  domainGroups = [];
  const groupMap    = {};
  const landingTabs = [];

  // Custom group rules from config.local.js (if any)
  const customGroups = typeof LOCAL_CUSTOM_GROUPS !== 'undefined' ? LOCAL_CUSTOM_GROUPS : [];

  // Check if a URL matches a custom group rule; returns the rule or null
  function matchCustomGroup(url) {
    try {
      const parsed = new URL(url);
      return customGroups.find(r => {
        const hostMatch = r.hostname
          ? parsed.hostname === r.hostname
          : r.hostnameEndsWith
            ? parsed.hostname.endsWith(r.hostnameEndsWith)
            : false;
        if (!hostMatch) return false;
        if (r.pathPrefix) return parsed.pathname.startsWith(r.pathPrefix);
        return true; // hostname matched, no path filter
      }) || null;
    } catch { return null; }
  }

  for (const tab of realTabs) {
    try {
      if (isLandingPage(tab.url)) {
        landingTabs.push(tab);
        continue;
      }

      const workflowRule = matchDataScienceGroup(tab);
      if (workflowRule) {
        const key = workflowRule.groupKey;
        if (!groupMap[key]) {
          groupMap[key] = {
            domain: key,
            groupKey: key,
            label: workflowRule.groupLabel,
            type: 'data-science',
            priority: DATA_SCIENCE_GROUPS.findIndex(group => group.groupKey === key),
            tabs: [],
          };
        }
        groupMap[key].tabs.push(tab);
        continue;
      }

      // Check custom group rules first (e.g. merge subdomains, split by path)
      const customRule = matchCustomGroup(tab.url);
      if (customRule) {
        const key = customRule.groupKey;
        if (!groupMap[key]) groupMap[key] = { domain: key, groupKey: key, label: customRule.groupLabel, tabs: [] };
        groupMap[key].tabs.push(tab);
        continue;
      }

      let hostname;
      if (tab.url && tab.url.startsWith('file://')) {
        hostname = 'local-files';
      } else {
        hostname = new URL(tab.url).hostname;
      }
      if (!hostname) continue;

      if (!groupMap[hostname]) groupMap[hostname] = { domain: hostname, tabs: [] };
      groupMap[hostname].tabs.push(tab);
    } catch {
      // Skip malformed URLs
    }
  }

  if (landingTabs.length > 0) {
    groupMap['__landing-pages__'] = { domain: '__landing-pages__', tabs: landingTabs };
  }

  // Sort: landing pages first, then data-science groups, then priority domains, then by tab count
  // Collect exact hostnames and suffix patterns for priority sorting
  const landingHostnames = new Set(LANDING_PAGE_PATTERNS.map(p => p.hostname).filter(Boolean));
  const landingSuffixes = LANDING_PAGE_PATTERNS.map(p => p.hostnameEndsWith).filter(Boolean);
  function isLandingDomain(domain) {
    if (landingHostnames.has(domain)) return true;
    return landingSuffixes.some(s => domain.endsWith(s));
  }
  domainGroups = Object.values(groupMap).sort((a, b) => {
    const aIsLanding = a.domain === '__landing-pages__';
    const bIsLanding = b.domain === '__landing-pages__';
    if (aIsLanding !== bIsLanding) return aIsLanding ? -1 : 1;

    const aIsDataScience = a.type === 'data-science';
    const bIsDataScience = b.type === 'data-science';
    if (aIsDataScience !== bIsDataScience) return aIsDataScience ? -1 : 1;
    if (aIsDataScience && bIsDataScience) return (a.priority || 0) - (b.priority || 0);

    const aIsPriority = isLandingDomain(a.domain);
    const bIsPriority = isLandingDomain(b.domain);
    if (aIsPriority !== bIsPriority) return aIsPriority ? -1 : 1;

    return b.tabs.length - a.tabs.length;
  });
  if (dashboardColumns) dashboardColumns.classList.toggle('no-live-data', domainGroups.length === 0);

  const cleanupItems = buildCleanupInsights(realTabs, domainGroups);
  const visibleGroups = getFilteredGroups(domainGroups);
  renderWorkspaceSidebar(domainGroups, realTabs, cleanupItems);
  renderFocusPanel(realTabs, domainGroups);
  renderCleanupPanel(cleanupItems);
  renderStatusSummary(realTabs);

  // --- Render domain cards ---
  const openTabsSection      = document.getElementById('openTabsSection');
  const openTabsMissionsEl   = document.getElementById('openTabsMissions');
  const openTabsSectionCount = document.getElementById('openTabsSectionCount');
  const openTabsSectionTitle = document.getElementById('openTabsSectionTitle');

  if (visibleGroups.length > 0 && openTabsSection) {
    if (openTabsSectionTitle) openTabsSectionTitle.textContent = 'Visão científica das abas';
    const filterText = activeGroupFilter !== 'all' || activeSearchQuery
      ? `${visibleGroups.length} de ${domainGroups.length} grupo${domainGroups.length !== 1 ? 's' : ''}`
      : `${domainGroups.length} grupo${domainGroups.length !== 1 ? 's' : ''}`;
    openTabsSectionCount.innerHTML = `${filterText} &nbsp;&middot;&nbsp; <button class="action-btn close-tabs" data-action="close-all-open-tabs" style="font-size:11px;padding:3px 10px;">${ICONS.close} Fechar ${realTabs.length === 1 ? '1 aba' : `todas as ${realTabs.length} abas`}</button>`;
    openTabsMissionsEl.innerHTML = visibleGroups.map(g => renderDomainCard(g)).join('');
    openTabsSection.style.display = 'block';
  } else if (openTabsSection) {
    if (openTabsSectionTitle) openTabsSectionTitle.textContent = 'Nenhum resultado';
    if (openTabsSectionCount) openTabsSectionCount.textContent = '0 grupos';
    openTabsMissionsEl.innerHTML = `
      <div class="missions-empty-state">
        <div class="empty-title">Nada encontrado.</div>
        <div class="empty-subtitle">Tente outro termo ou volte para todos os grupos.</div>
      </div>
    `;
    openTabsSection.style.display = 'block';
  }

  // --- Footer stats ---
  const statTabs = document.getElementById('statTabs');
  if (statTabs) statTabs.textContent = openTabs.length;
  const statGroups = document.getElementById('statGroups');
  if (statGroups) statGroups.textContent = domainGroups.length;
  const statCleanup = document.getElementById('statCleanup');
  if (statCleanup) statCleanup.textContent = cleanupItems.length;

  // --- Check for duplicate Abas Cientistas tabs ---
  checkTabOutDupes();

  // --- Render "Saved for Later" column ---
  await renderDeferredColumn();
}

async function renderDashboard() {
  await renderStaticDashboard();
}


/* ----------------------------------------------------------------
   EVENT HANDLERS — using event delegation

   One listener on document handles ALL button clicks.
   Think of it as one security guard watching the whole building
   instead of one per door.
   ---------------------------------------------------------------- */

document.addEventListener('click', async (e) => {
  // Walk up the DOM to find the nearest element with data-action
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  if (action === 'set-theme') {
    applyTheme(actionEl.dataset.themeValue);
    return;
  }

  if (action === 'filter-group') {
    activeGroupFilter = actionEl.dataset.groupKey || 'all';
    await renderStaticDashboard();
    return;
  }

  // ---- Close duplicate Abas Cientistas tabs ----
  if (action === 'close-tabout-dupes') {
    await closeTabOutDupes();
    playCloseSound();
    const banner = document.getElementById('tabOutDupeBanner');
    if (banner) {
      banner.style.transition = 'opacity 0.4s';
      banner.style.opacity = '0';
      setTimeout(() => { banner.style.display = 'none'; banner.style.opacity = '1'; }, 400);
    }
    showToast('Abas extras do Abas Cientistas fechadas');
    return;
  }

  const card = actionEl.closest('.mission-card');

  // ---- Expand overflow chips ("+N more") ----
  if (action === 'expand-chips') {
    const overflowContainer = actionEl.parentElement.querySelector('.page-chips-overflow');
    if (overflowContainer) {
      overflowContainer.style.display = 'contents';
      actionEl.remove();
    }
    return;
  }

  // ---- Focus a specific tab ----
  if (action === 'focus-tab') {
    const tabUrl = actionEl.dataset.tabUrl;
    if (tabUrl) await focusTab(tabUrl);
    return;
  }

  // ---- Close a single tab ----
  if (action === 'close-single-tab') {
    e.stopPropagation(); // don't trigger parent chip's focus-tab
    const tabUrl = actionEl.dataset.tabUrl;
    if (!tabUrl) return;

    // Close the tab in Chrome directly
    const allTabs = await chrome.tabs.query({});
    const match   = allTabs.find(t => t.url === tabUrl);
    if (match) await chrome.tabs.remove(match.id);
    await fetchOpenTabs();

    playCloseSound();

    // Animate the chip row out
    const chip = actionEl.closest('.page-chip');
    if (chip) {
      const rect = chip.getBoundingClientRect();
      shootConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      chip.style.transition = 'opacity 0.2s, transform 0.2s';
      chip.style.opacity    = '0';
      chip.style.transform  = 'scale(0.8)';
      setTimeout(() => {
        chip.remove();
        // If the card now has no tabs, remove it too
        const parentCard = document.querySelector('.mission-card:has(.mission-pages:empty)');
        if (parentCard) animateCardOut(parentCard);
        document.querySelectorAll('.mission-card').forEach(c => {
          if (c.querySelectorAll('.page-chip[data-action="focus-tab"]').length === 0) {
            animateCardOut(c);
          }
        });
      }, 200);
    }

    // Update footer
    const statTabs = document.getElementById('statTabs');
    if (statTabs) statTabs.textContent = openTabs.length;

    showToast('Aba fechada');
    return;
  }

  // ---- Save a single tab for later (then close it) ----
  if (action === 'defer-single-tab') {
    e.stopPropagation();
    const tabUrl   = actionEl.dataset.tabUrl;
    const tabTitle = actionEl.dataset.tabTitle || tabUrl;
    if (!tabUrl) return;

    // Save to chrome.storage.local
    try {
      await saveTabForLater({ url: tabUrl, title: tabTitle });
    } catch (err) {
      console.error('[abas-cientistas] Falha ao salvar aba:', err);
      showToast('Não foi possível salvar a aba');
      return;
    }

    // Close the tab in Chrome
    const allTabs = await chrome.tabs.query({});
    const match   = allTabs.find(t => t.url === tabUrl);
    if (match) await chrome.tabs.remove(match.id);
    await fetchOpenTabs();

    // Animate chip out
    const chip = actionEl.closest('.page-chip');
    if (chip) {
      chip.style.transition = 'opacity 0.2s, transform 0.2s';
      chip.style.opacity    = '0';
      chip.style.transform  = 'scale(0.8)';
      setTimeout(() => chip.remove(), 200);
    }

    showToast('Salvo para revisar depois');
    await renderDeferredColumn();
    return;
  }

  // ---- Check off a saved tab (moves it to archive) ----
  if (action === 'check-deferred') {
    const id = actionEl.dataset.deferredId;
    if (!id) return;

    await checkOffSavedTab(id);

    // Animate: strikethrough first, then slide out
    const item = actionEl.closest('.deferred-item');
    if (item) {
      item.classList.add('checked');
      setTimeout(() => {
        item.classList.add('removing');
        setTimeout(() => {
          item.remove();
          renderDeferredColumn(); // refresh counts and archive
        }, 300);
      }, 800);
    }
    return;
  }

  // ---- Dismiss a saved tab (removes it entirely) ----
  if (action === 'dismiss-deferred') {
    const id = actionEl.dataset.deferredId;
    if (!id) return;

    await dismissSavedTab(id);

    const item = actionEl.closest('.deferred-item');
    if (item) {
      item.classList.add('removing');
      setTimeout(() => {
        item.remove();
        renderDeferredColumn();
      }, 300);
    }
    return;
  }

  // ---- Close all tabs in a domain group ----
  if (action === 'close-domain-tabs') {
    const domainId = actionEl.dataset.domainId;
    const group    = domainGroups.find(g => {
      return 'domain-' + g.domain.replace(/[^a-z0-9]/g, '-') === domainId;
    });
    if (!group) return;

    const urls      = group.tabs.map(t => t.url);
    // Landing pages and custom groups (whose domain key isn't a real hostname)
    // must use exact URL matching to avoid closing unrelated tabs
    const useExact  = group.domain === '__landing-pages__' || !!group.label;

    if (useExact) {
      await closeTabsExact(urls);
    } else {
      await closeTabsByUrls(urls);
    }

    if (card) {
      playCloseSound();
      animateCardOut(card);
    }

    // Remove from in-memory groups
    const idx = domainGroups.indexOf(group);
    if (idx !== -1) domainGroups.splice(idx, 1);

    const groupLabel = group.domain === '__landing-pages__' ? 'Portais de entrada' : (group.label || friendlyDomain(group.domain));
    showToast(`${urls.length === 1 ? 'Aba fechada' : `${urls.length} abas fechadas`} em ${groupLabel}`);

    const statTabs = document.getElementById('statTabs');
    if (statTabs) statTabs.textContent = openTabs.length;
    return;
  }

  // ---- Close duplicates, keep one copy ----
  if (action === 'dedup-keep-one') {
    const urlsEncoded = actionEl.dataset.dupeUrls || '';
    const urls = urlsEncoded.split(',').map(u => decodeURIComponent(u)).filter(Boolean);
    if (urls.length === 0) return;

    await closeDuplicateTabs(urls, true);
    playCloseSound();

    // Hide the dedup button
    actionEl.style.transition = 'opacity 0.2s';
    actionEl.style.opacity    = '0';
    setTimeout(() => actionEl.remove(), 200);

    // Remove dupe badges from the card
    if (card) {
      card.querySelectorAll('.chip-dupe-badge').forEach(b => {
        b.style.transition = 'opacity 0.2s';
        b.style.opacity    = '0';
        setTimeout(() => b.remove(), 200);
      });
      card.querySelectorAll('.open-tabs-badge').forEach(badge => {
        if (badge.textContent.includes('duplicada')) {
          badge.style.transition = 'opacity 0.2s';
          badge.style.opacity    = '0';
          setTimeout(() => badge.remove(), 200);
        }
      });
      card.classList.remove('has-amber-bar');
      card.classList.add('has-neutral-bar');
    }

    showToast('Duplicadas fechadas, mantendo uma cópia');
    return;
  }

  // ---- Close ALL open tabs ----
  if (action === 'close-all-open-tabs') {
    const allUrls = openTabs
      .filter(t => t.url && !t.url.startsWith('chrome') && !t.url.startsWith('about:'))
      .map(t => t.url);
    await closeTabsByUrls(allUrls);
    playCloseSound();

    document.querySelectorAll('#openTabsMissions .mission-card').forEach(c => {
      shootConfetti(
        c.getBoundingClientRect().left + c.offsetWidth / 2,
        c.getBoundingClientRect().top  + c.offsetHeight / 2
      );
      animateCardOut(c);
    });

    showToast('Todas as abas foram fechadas. Recomeço limpo.');
    return;
  }
});

// ---- Archive toggle — expand/collapse the archive section ----
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('#archiveToggle');
  if (!toggle) return;

  toggle.classList.toggle('open');
  const body = document.getElementById('archiveBody');
  if (body) {
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  }
});

// ---- Archive search — filter archived items as user types ----
document.addEventListener('input', async (e) => {
  if (e.target.id === 'tabSearch') {
    activeSearchQuery = e.target.value.trim();
    await renderStaticDashboard();
    return;
  }

  if (e.target.id !== 'archiveSearch') return;

  const q = e.target.value.trim().toLowerCase();
  const archiveList = document.getElementById('archiveList');
  if (!archiveList) return;

  try {
    const { archived } = await getSavedTabs();

    if (q.length < 2) {
      // Show all archived items
      archiveList.innerHTML = archived.map(item => renderArchiveItem(item)).join('');
      return;
    }

    // Filter by title or URL containing the query string
    const results = archived.filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.url  || '').toLowerCase().includes(q)
    );

    archiveList.innerHTML = results.map(item => renderArchiveItem(item)).join('')
      || '<div style="font-size:12px;color:var(--muted);padding:8px 0">Nenhum resultado</div>';
  } catch (err) {
    console.warn('[abas-cientistas] Busca no arquivo falhou:', err);
  }
});


/* ----------------------------------------------------------------
   INITIALIZE
   ---------------------------------------------------------------- */
initTheme();
renderDashboard();

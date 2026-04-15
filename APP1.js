// ─── GLOBALS ──────────────────────────────────────────────────────────────────
let gcLoaded = 12, mldLoaded = 12;
let comboPage = 1, combosPerPage = 12;
let activeColors = new Set(['W','U','B','R','G']);
let activeType = 'all';
let comboSearch = '';
let filteredCombos = [];
let selectedCmdr = null, selectedCmdr2 = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildFAQ();
  buildGCGrid();
  buildMLDGrid();
  buildCombosView();
  setupAutocomplete();
  setupScrollTop();
  // unlock second commander after first is chosen
  document.getElementById('cmdr-input').addEventListener('input', () => {
    const v = document.getElementById('cmdr-input').value.trim();
    if (!v) {
      document.getElementById('cmdr2-input').disabled = true;
      document.getElementById('cmdr2-input').value = '';
      selectedCmdr = null;
      document.getElementById('cmdr-color-pills').innerHTML = '';
    }
  });
});

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function buildFAQ() {
  const container = document.getElementById('faq-list');
  FAQ_DATA.forEach((item, i) => {
    container.innerHTML += `
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFAQ(this)">
          <span>${item.q}</span>
          <span class="faq-chevron">▼</span>
        </button>
        <div class="faq-a">${item.a}</div>
      </div>`;
  });
}
function toggleFAQ(btn) {
  const ans = btn.nextElementSibling;
  const chev = btn.querySelector('.faq-chevron');
  ans.classList.toggle('open');
  chev.classList.toggle('open');
}

// ─── DEFINITIONS ──────────────────────────────────────────────────────────────
function toggleDef(card) {
  const body = card.querySelector('.def-body');
  const hint = card.querySelector('.def-hint');
  body.classList.toggle('open');
  hint.textContent = body.classList.contains('open') ? 'Toca para cerrar ▴' : 'Toca para ver más ▾';
}

// ─── RULES ───────────────────────────────────────────────────────────────────
function toggleRule(header) {
  const body = header.nextElementSibling;
  const chev = header.querySelector('.rule-chevron');
  body.classList.toggle('open');
  chev.classList.toggle('open');
}

// ─── GAME CHANGERS GRID ───────────────────────────────────────────────────────
function buildGCGrid() {
  const grid = document.getElementById('gc-grid');
  const showMore = document.getElementById('gc-load-more');
  grid.innerHTML = '';
  const slice = GAME_CHANGERS.slice(0, gcLoaded);
  slice.forEach(name => {
    grid.innerHTML += cardThumb(name);
  });
  if (gcLoaded < GAME_CHANGERS.length) showMore.style.display = 'block';
  else showMore.style.display = 'none';
}
function loadMoreGC() {
  gcLoaded = Math.min(gcLoaded + 12, GAME_CHANGERS.length);
  buildGCGrid();
}

// ─── MLD GRID ─────────────────────────────────────────────────────────────────
function buildMLDGrid() {
  const grid = document.getElementById('mld-grid');
  const showMore = document.getElementById('mld-load-more');
  grid.innerHTML = '';
  const slice = MLD_CARDS.slice(0, mldLoaded);
  slice.forEach(name => grid.innerHTML += cardThumb(name));
  if (mldLoaded < MLD_CARDS.length) showMore.style.display = 'block';
  else showMore.style.display = 'none';
}
function loadMoreMLD() {
  mldLoaded = Math.min(mldLoaded + 12, MLD_CARDS.length);
  buildMLDGrid();
}

function cardThumb(name) {
  const q = encodeURIComponent(name);
  return `
    <div class="card-thumb" title="${name}">
      <img src="https://api.scryfall.com/cards/named?format=image&version=normal&fuzzy=${q}"
           loading="lazy" alt="${name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 63 88%22><rect width=%2263%22 height=%2288%22 fill=%22%231a1a24%22/><text x=%2231%22 y=%2244%22 fill=%22%237a7890%22 text-anchor=%22middle%22 font-size=%228%22>?</text></svg>'">
      <div class="card-name-overlay">${name}</div>
    </div>`;
}

// ─── COMBOS ───────────────────────────────────────────────────────────────────
function buildCombosView() {
  applyComboFilters();
}

function toggleColorFilter(color, btn) {
  if (activeColors.has(color)) {
    if (activeColors.size === 1) return; // keep at least one
    activeColors.delete(color);
    btn.classList.remove('active');
  } else {
    activeColors.add(color);
    btn.classList.add('active');
  }
  comboPage = 1;
  applyComboFilters();
}

function setTypeFilter(type, btn) {
  activeType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  comboPage = 1;
  applyComboFilters();
}

function filterCombos() {
  comboSearch = document.getElementById('combo-search').value.toLowerCase();
  comboPage = 1;
  applyComboFilters();
}

const typeKeywords = {
  win: ['win condition','win'],
  mana: ['maná infinito','mana infinito','infinite mana','mana'],
  damage: ['daño','damage','daño infinito'],
  draw: ['card draw','draw'],
  tokens: ['tokens','token'],
  lock: ['lock'],
  mill: ['mill'],
};

function applyComboFilters() {
  filteredCombos = COMBOS_DATA.filter(combo => {
    // color filter
    const comboColors = combo.colors || 'C';
    let colorMatch = false;
    if (activeColors.has('W') && comboColors.includes('W')) colorMatch = true;
    if (activeColors.has('U') && comboColors.includes('U')) colorMatch = true;
    if (activeColors.has('B') && comboColors.includes('B')) colorMatch = true;
    if (activeColors.has('R') && comboColors.includes('R')) colorMatch = true;
    if (activeColors.has('G') && comboColors.includes('G')) colorMatch = true;
    if (activeColors.has('C') && comboColors === 'C') colorMatch = true;
    if (!colorMatch) return false;

    // type filter
    if (activeType !== 'all') {
      const kw = typeKeywords[activeType] || [];
      const tagsLower = (combo.tags || []).map(t => t.toLowerCase());
      const match = kw.some(k => tagsLower.some(t => t.includes(k)));
      if (!match) return false;
    }

    // search filter
    if (comboSearch) {
      const c1l = (combo.c1 || '').toLowerCase();
      const c2l = (combo.c2 || '').toLowerCase();
      if (!c1l.includes(comboSearch) && !c2l.includes(comboSearch)) return false;
    }

    return true;
  });

  document.getElementById('combo-count-shown').textContent = filteredCombos.length;
  document.getElementById('combo-count-total').textContent = COMBOS_DATA.length;
  renderCombosPage();
  renderPagination();
}

function renderCombosPage() {
  const grid = document.getElementById('combos-grid');
  const start = (comboPage - 1) * combosPerPage;
  const slice = filteredCombos.slice(start, start + combosPerPage);
  grid.innerHTML = '';

  if (slice.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;padding:2rem 0;text-align:center;">No se encontraron combos con los filtros actuales.</p>';
    return;
  }

  slice.forEach(combo => {
    const img1 = combo.img1
      ? `https://cards.scryfall.io/normal/front/${combo.img1}.jpg`
      : `https://api.scryfall.com/cards/named?format=image&version=normal&fuzzy=${encodeURIComponent(combo.c1)}`;
    const img2 = combo.img2
      ? `https://cards.scryfall.io/normal/front/${combo.img2}.jpg`
      : `https://api.scryfall.com/cards/named?format=image&version=normal&fuzzy=${encodeURIComponent(combo.c2)}`;

    const tagsHtml = (combo.tags || []).map(t =>
      `<span class="combo-tag">${t}</span>`
    ).join('');

    grid.innerHTML += `
      <div class="combo-card">
        <div class="combo-card-imgs">
          <img class="combo-card-img" src="${img1}" loading="lazy"
               onerror="this.style.display='none'" alt="${combo.c1}">
          <img class="combo-card-img" src="${img2}" loading="lazy"
               onerror="this.style.display='none'" alt="${combo.c2}">
        </div>
        <div class="combo-card-info">
          <div class="combo-card-names">
            <span>${combo.c1}</span>
            <span class="plus">+</span>
            <span>${combo.c2}</span>
          </div>
          <div class="combo-tags">${tagsHtml}</div>
        </div>
      </div>`;
  });
}

function renderPagination() {
  const totalPages = Math.ceil(filteredCombos.length / combosPerPage);
  const pg = document.getElementById('combos-pagination');
  pg.innerHTML = '';
  if (totalPages <= 1) return;

  const add = (label, page, disabled, active) => {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.disabled = disabled;
    btn.onclick = () => { comboPage = page; renderCombosPage(); renderPagination(); window.location.hash='combos'; };
    pg.appendChild(btn);
  };

  add('←', comboPage - 1, comboPage === 1, false);

  let pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages = [1];
    if (comboPage > 3) pages.push('…');
    for (let i = Math.max(2, comboPage-1); i <= Math.min(totalPages-1, comboPage+1); i++) pages.push(i);
    if (comboPage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  pages.forEach(p => {
    if (p === '…') {
      const sp = document.createElement('span');
      sp.className = 'page-info';
      sp.textContent = '…';
      pg.appendChild(sp);
    } else {
      add(p, p, false, p === comboPage);
    }
  });

  add('→', comboPage + 1, comboPage === totalPages, false);

  const info = document.createElement('span');
  info.className = 'page-info';
  info.style.marginLeft = '0.5rem';
  info.textContent = `Pág. ${comboPage} de ${totalPages}`;
  pg.appendChild(info);
}

// ─── AUTOCOMPLETE ─────────────────────────────────────────────────────────────
function setupAutocomplete() {
  setupCmdrAC('cmdr-input', 'cmdr-dropdown', 1);
  setupCmdrAC('cmdr2-input', 'cmdr2-dropdown', 2);
}

function setupCmdrAC(inputId, dropdownId, which) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);

  input.addEventListener('input', () => {
    const val = input.value.toLowerCase().trim();
    if (!val || val.length < 2) { dropdown.classList.remove('open'); return; }

    const matches = COMMANDERS.filter(c => c.name.toLowerCase().includes(val)).slice(0, 10);
    if (!matches.length) { dropdown.classList.remove('open'); return; }

    dropdown.innerHTML = matches.map(c => {
      const pips = [...c.colors].map(col =>
        `<span class="ci-pip ci-${col}"></span>`
      ).join('');
      const partnerBadge = c.partner ? ' <small style="color:var(--gold);font-size:0.65rem;">[Partner]</small>' : '';
      return `<div class="autocomplete-item" data-name="${c.name}" data-colors="${c.colors}" data-partner="${c.partner}" onclick="selectCommander(this, ${which})">
        <span style="flex:1">${c.name}${partnerBadge}</span>
        <div class="ci-pills">${pips}</div>
      </div>`;
    }).join('');
    dropdown.classList.add('open');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

function selectCommander(el, which) {
  const name = el.dataset.name;
  const colors = el.dataset.colors;
  const partner = el.dataset.partner === 'true';

  if (which === 1) {
    selectedCmdr = { name, colors, partner };
    document.getElementById('cmdr-input').value = name;
    document.getElementById('cmdr-dropdown').classList.remove('open');
    renderColorPills('cmdr-color-pills', colors);
  } else {
    selectedCmdr2 = { name, colors, partner };
    document.getElementById('cmdr2-input').value = name;
    document.getElementById('cmdr2-dropdown').classList.remove('open');
    renderColorPills('cmdr2-color-pills', colors);
  }
}

function renderColorPills(containerId, colorStr) {
  const container = document.getElementById(containerId);
  const colorNames = { W:'Blanco', U:'Azul', B:'Negro', R:'Rojo', G:'Verde' };
  container.innerHTML = [...colorStr].map(c =>
    `<span class="color-pill ${c}">${c}</span>`
  ).join('');
}

// ─── VERIFICADOR ──────────────────────────────────────────────────────────────
function parseDecklist(text) {
  const lines = text.split('\n');
  const cards = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    // skip category headers
    if (/^\[/.test(line) || /^(Commander|Sideboard|Companion|Maybeboard)/i.test(line)) continue;
    if (/^\/\//.test(line)) continue;
    // remove foil markers, set codes, collector numbers
    line = line.replace(/\s*\*[EF]\*?/gi, '').replace(/\s*\([A-Z0-9]+\)\s*\d*/g, '').trim();
    // standard "1 Card Name"
    const m = line.match(/^(\d+)x?\s+(.+)/);
    if (m) {
      const qty = parseInt(m[1]);
      let name = m[2].trim().replace(/\s*\/\/.*$/, '').trim(); // handle split cards
      for (let i = 0; i < qty; i++) cards.push(name);
    }
  }
  return cards;
}

function verificarDecklist() {
  const btn = document.getElementById('btn-verificar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Verificando...';

  setTimeout(() => {
    try {
      _runVerification();
    } catch(e) {
      console.error(e);
    }
    btn.disabled = false;
    btn.innerHTML = '🔍 Verificar Decklist';
    document.getElementById('verif-results').style.display = 'block';
    document.getElementById('verif-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 600);
}

function _runVerification() {
  const deckRaw = document.getElementById('decklist-input').value;
  const cmdrName = (selectedCmdr?.name || document.getElementById('cmdr-input').value.trim()).toLowerCase();
  const cmdr2Name = (selectedCmdr2?.name || document.getElementById('cmdr2-input').value.trim()).toLowerCase();

  const cards = parseDecklist(deckRaw);
  const cardsLower = cards.map(c => c.toLowerCase());
  const allCards = [...cardsLower];
  if (cmdrName) allCards.push(cmdrName);
  if (cmdr2Name) allCards.push(cmdr2Name);

  if (cards.length === 0 && !cmdrName) {
    showResult('warn', '⚠️', 'Decklist vacía', 'Pega tu lista de cartas para verificar.', [], []);
    return;
  }

  const violations = [];
  const checks = [];

  // 1. Total de cartas
  const totalWithCmdr = cards.length + (cmdrName ? 1 : 0) + (cmdr2Name ? 1 : 0);
  const totalOk = totalWithCmdr >= 98 && totalWithCmdr <= 102;
  checks.push({ label: 'Total de cartas', val: `${totalWithCmdr} cartas`, state: totalOk ? 'pass' : 'warn', icon: totalOk ? '✓' : '⚠️' });

  // 2. Singleton (no duplicates except basic lands)
  const basics = ['plains','island','swamp','mountain','forest','wastes'];
  const cardCounts = {};
  cardsLower.forEach(c => {
    const clean = c.replace(/^\d+\s+/, '');
    if (!basics.includes(clean)) cardCounts[clean] = (cardCounts[clean] || 0) + 1;
  });
  const dupCards = Object.entries(cardCounts).filter(([,v]) => v > 1);
  if (dupCards.length > 0) {
    violations.push({ title: 'Regla Singleton violada', msg: `Cartas duplicadas: ${dupCards.map(([n]) => n).join(', ')}` });
  }
  checks.push({ label: 'Singleton', val: dupCards.length === 0 ? 'Sin duplicados' : `${dupCards.length} duplicado(s)`, state: dupCards.length === 0 ? 'pass' : 'fail', icon: dupCards.length === 0 ? '✓' : '✗' });

  // 3. Commander banlist
  const bannedInDeck = COMMANDER_BANLIST.filter(b => allCards.includes(b.toLowerCase()));
  if (bannedInDeck.length > 0) {
    violations.push({ title: 'Carta en Banlist oficial', msg: bannedInDeck.join(', ') });
  }
  checks.push({ label: 'Banlist Commander', val: bannedInDeck.length === 0 ? 'Sin cartas baneadas' : `${bannedInDeck.length} carta(s) baneada(s)`, state: bannedInDeck.length === 0 ? 'pass' : 'fail', icon: bannedInDeck.length === 0 ? '✓' : '✗' });

  // 4. Game Changers
  const gcInDeck = GAME_CHANGERS.filter(gc => allCards.includes(gc.toLowerCase()));
  const gcOk = gcInDeck.length <= 3;
  if (!gcOk) {
    violations.push({ title: `Game Changers: ${gcInDeck.length}/3 (máximo 3)`, msg: `Game Changers encontrados: ${gcInDeck.join(', ')}` });
  }
  checks.push({ label: 'Game Changers', val: `${gcInDeck.length} / 3`, state: gcOk ? (gcInDeck.length >= 2 ? 'warn' : 'pass') : 'fail', icon: gcOk ? (gcInDeck.length >= 2 ? '⚠️' : '✓') : '✗' });

  // 5. MLD
  const mldInDeck = MLD_CARDS.filter(c => allCards.includes(c.toLowerCase()));
  if (mldInDeck.length > 0) {
    violations.push({ title: 'Carta(s) MLD prohibida(s)', msg: mldInDeck.join(', ') });
  }
  checks.push({ label: 'Cartas MLD', val: mldInDeck.length === 0 ? 'Sin cartas MLD' : `${mldInDeck.length} carta(s) MLD`, state: mldInDeck.length === 0 ? 'pass' : 'fail', icon: mldInDeck.length === 0 ? '✓' : '✗' });

  // 6. Extra turns
  const etInDeck = EXTRA_TURN_CARDS.filter(c => allCards.includes(c.toLowerCase()));
  let etState = 'pass', etIcon = '✓';
  if (etInDeck.length >= 4) { etState = 'fail'; etIcon = '✗'; }
  else if (etInDeck.length >= 3) { etState = 'warn'; etIcon = '⚠️'; }
  else if (etInDeck.length >= 1) { etState = 'warn'; etIcon = '⚠️'; }
  if (etInDeck.length >= 4) {
    violations.push({ title: `Turnos Extra: ${etInDeck.length} cartas (riesgo alto)`, msg: etInDeck.join(', ') });
  }
  checks.push({ label: 'Turnos Extra', val: etInDeck.length === 0 ? 'Sin cartas de turno extra' : `${etInDeck.length} carta(s)`, state: etState, icon: etIcon });

  // 7. Prohibited 2-card combos
  const foundCombos = COMBOS_DATA.filter(combo => {
    return allCards.includes(combo.c1.toLowerCase()) && allCards.includes(combo.c2.toLowerCase());
  });
  if (foundCombos.length > 0) {
    foundCombos.forEach(combo => {
      violations.push({ title: `Combo prohibido (Regla 1.1)`, msg: `${combo.c1} + ${combo.c2} → ${(combo.tags||[]).join(', ')}` });
    });
  }
  checks.push({ label: 'Combos prohibidos', val: foundCombos.length === 0 ? 'Ninguno detectado' : `${foundCombos.length} combo(s)`, state: foundCombos.length === 0 ? 'pass' : 'fail', icon: foundCombos.length === 0 ? '✓' : '✗' });

  // Determine overall state
  const hasFail = violations.length > 0 || !gcOk || bannedInDeck.length > 0 || mldInDeck.length > 0 || dupCards.length > 0 || foundCombos.length > 0;
  const hasWarn = !hasFail && (gcInDeck.length >= 2 || etInDeck.length >= 1);

  if (hasFail) {
    showResult('fail', '✗', 'Decklist no cumple con Bracket 3', `Se encontraron ${violations.length} infracción(es). Debes corregirlas antes del torneo.`, checks, violations);
  } else if (hasWarn) {
    showResult('warn', '⚠️', 'Decklist con avisos', 'Tu mazo cumple las reglas pero tiene elementos a revisar.', checks, violations);
  } else {
    showResult('ok', '✓', 'Decklist válida para Bracket 3', 'Tu mazo cumple con todas las restricciones del formato.', checks, violations);
  }
}

function showResult(type, icon, title, sub, checks, violations) {
  const banner = document.getElementById('result-banner');
  banner.className = `result-banner ${type}`;
  banner.innerHTML = `
    <span class="rb-icon">${icon}</span>
    <div>
      <div class="rb-title">${title}</div>
      <div class="rb-sub">${sub}</div>
    </div>`;

  const checksEl = document.getElementById('result-checks');
  checksEl.innerHTML = checks.map(c => `
    <div class="result-check ${c.state}">
      <span class="rc-icon">${c.icon}</span>
      <div>
        <div class="rc-label">${c.label}</div>
        <div class="rc-val">${c.val}</div>
      </div>
    </div>`).join('');

  const violEl = document.getElementById('violations-list');
  if (violations.length > 0) {
    violEl.innerHTML = `<h3 style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--red);letter-spacing:0.1em;margin-bottom:1rem;text-transform:uppercase;">Infracciones Detectadas</h3>` +
      violations.map(v => `
        <div class="viol-item">
          <h4>⚠ ${v.title}</h4>
          <p>${v.msg}</p>
        </div>`).join('');
  } else {
    violEl.innerHTML = '';
  }
}

// ─── CHANGELOG ────────────────────────────────────────────────────────────────
function openChangelog() {
  document.getElementById('changelog-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeChangelog(e) {
  if (!e || e.target === document.getElementById('changelog-modal') || e.target.classList.contains('modal-close')) {
    document.getElementById('changelog-modal').classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
function updateCharCount(el, countId) {
  const count = document.getElementById(countId);
  count.textContent = el.value.length;
}
function submitForm() {
  const msg = document.getElementById('f-msg').value.trim();
  if (!msg) { alert('Por favor escribe un mensaje.'); return; }
  document.getElementById('form-success').style.display = 'block';
  document.getElementById('f-name').value = '';
  document.getElementById('f-email').value = '';
  document.getElementById('f-msg').value = '';
  document.getElementById('f-count').textContent = '0';
  setTimeout(() => document.getElementById('form-success').style.display = 'none', 5000);
}

// ─── SCROLL TO TOP ────────────────────────────────────────────────────────────
function setupScrollTop() {
  const btn = document.getElementById('scrolltop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  });
}

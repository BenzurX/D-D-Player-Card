// ── STATE ─────────────────────────────────────────────────────
let characters    = JSON.parse(localStorage.getItem('dnd_characters') || 'null') || [];
let currentCharId = localStorage.getItem('dnd_current_char') || null;

function currentChar() {
  return characters.find(c => c.id === currentCharId) || characters[0] || null;
}

function save() {
  localStorage.setItem('dnd_characters', JSON.stringify(characters));
  localStorage.setItem('dnd_current_char', currentCharId || '');
}

function blankAbilities() {
  return {
    attack_action: [], magic_action: [], items_action: [], features_action: [],
    dash_action:   [], dodge_action: [], disengage_action: [], hide_action: [],
    help_action:   [], ready_action: [],
    attack_bonus:  [], magic_bonus: [], items_bonus: [], features_bonus: [],
    reaction: [], defense: [], explore: []
  };
}

// ── CATEGORY CONFIG ───────────────────────────────────────────
const CATEGORIES = {
  attack:    { icon: 'ti-sword',           color: 'c-red',    label: 'Attack' },
  magic:     { icon: 'ti-wand',            color: 'c-purple', label: 'Magic' },
  items:     { icon: 'ti-flask',           color: 'c-green',  label: 'Items' },
  features:  { icon: 'ti-sparkles',        color: 'c-amber',  label: 'Features' },
  dash:      { icon: 'ti-shoe',            color: 'c-blue',   label: 'Dash' },
  dodge:     { icon: 'ti-run',             color: 'c-plum',   label: 'Dodge' },
  disengage: { icon: 'ti-cloud',           color: 'c-blue',   label: 'Disengage' },
  hide:      { icon: 'ti-eye-off',         color: 'c-slate',  label: 'Hide' },
  help:      { icon: 'ti-heart-handshake', color: 'c-sage',   label: 'Help' },
  ready:     { icon: 'ti-clock-pause',     color: 'c-gold',   label: 'Ready' },
  reaction:  { icon: 'ti-bolt',            color: 'c-purple', label: 'Reaction' },
  defense:   { icon: 'ti-shield-half',     color: 'c-blue',   label: 'Defense' },
  explore:   { icon: 'ti-map',             color: 'c-green',  label: 'Explore' },
};

// ── WELCOME SCREEN ────────────────────────────────────────────
function showWelcome() {
  document.getElementById('app').style.display     = 'none';
  document.getElementById('welcome').style.display = 'flex';
}

function hideWelcome() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('app').style.display     = 'flex';
}

document.getElementById('welcomeCreate').addEventListener('click', () => {
  openNewCharSheet(true);
});

// ── NEW CHARACTER FORM ────────────────────────────────────────
function openNewCharSheet(fromWelcome) {
  document.getElementById('newCharBody').innerHTML = `
    <div class="edit-form">

      <div class="form-row">
        <label class="form-label"><i class="ti ti-user"></i> Character Name</label>
        <input class="form-input" id="nc-name" placeholder="e.g. Amara Witchbane" autocomplete="off">
      </div>

      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label"><i class="ti ti-crown"></i> Level</label>
          <input class="form-input" id="nc-level" type="number" min="1" max="20" placeholder="5">
        </div>
        <div class="form-row">
          <label class="form-label"><i class="ti ti-award"></i> Proficiency Bonus</label>
          <input class="form-input" id="nc-prof" placeholder="+3">
        </div>
      </div>

      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label"><i class="ti ti-wand"></i> Class</label>
          <input class="form-input" id="nc-class" placeholder="e.g. Fighter">
        </div>
        <div class="form-row">
          <label class="form-label"><i class="ti ti-dna"></i> Species</label>
          <input class="form-input" id="nc-species" placeholder="e.g. Human">
        </div>
      </div>

      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label"><i class="ti ti-heart"></i> Max HP</label>
          <input class="form-input" id="nc-hp" type="number" min="1" placeholder="34">
        </div>
        <div class="form-row">
          <label class="form-label"><i class="ti ti-shield"></i> Armor Class</label>
          <input class="form-input" id="nc-ac" type="number" min="1" placeholder="15">
        </div>
      </div>

      <div class="form-row">
        <label class="form-label"><i class="ti ti-shoe"></i> Movement Speed</label>
        <input class="form-input" id="nc-speed" placeholder="e.g. 30ft">
      </div>

      <div class="form-actions">
        <button class="btn-cancel" id="nc-cancel">Cancel</button>
        <button class="btn-save"   id="nc-save"><i class="ti ti-check"></i> Create</button>
      </div>

    </div>`;

  document.getElementById('nc-cancel').addEventListener('click', () => {
    closeOverlay('newCharOverlay');
  });

  document.getElementById('nc-save').addEventListener('click', () => {
    const name    = document.getElementById('nc-name').value.trim();
    const level   = document.getElementById('nc-level').value.trim();
    const cls     = document.getElementById('nc-class').value.trim();
    const species = document.getElementById('nc-species').value.trim();
    const hp      = parseInt(document.getElementById('nc-hp').value)  || 10;
    const ac      = parseInt(document.getElementById('nc-ac').value)  || 10;
    const speed   = document.getElementById('nc-speed').value.trim()  || '30ft';
    const prof    = document.getElementById('nc-prof').value.trim()   || '+2';

    if (!name) { document.getElementById('nc-name').focus(); return; }

    const subParts = [
      level   ? `Lvl ${level}` : null,
      species || null,
      cls     || null
    ].filter(Boolean);

    const id = 'char_' + Date.now();
    characters.push({
      id, name,
      sub: subParts.join(' · '),
      hp, ac, speed, prof,
      abilities: blankAbilities()
    });
    currentCharId = id;
    save();

    closeOverlay('newCharOverlay');
    if (fromWelcome) hideWelcome();
    renderHeader();
    renderAllSimpleTabs();
  });

  openOverlay('newCharOverlay');
}

document.getElementById('newCharClose').addEventListener('click', () => closeOverlay('newCharOverlay'));

// ── RENDER HEADER ─────────────────────────────────────────────
function renderHeader() {
  const c = currentChar();
  if (!c) return;
  document.getElementById('charName').textContent  = c.name;
  document.getElementById('charSub').textContent   = c.sub   || '';
  document.getElementById('hpVal').textContent     = c.hp;
  document.getElementById('acVal').textContent     = c.ac;
  document.getElementById('speedVal').textContent  = c.speed || '30ft';
  document.getElementById('profVal').textContent   = c.prof  || '+2';
}

// ── RENDER ABILITY CARD HTML ──────────────────────────────────
function renderAbilityCard(a, key) {
  const badgeLabel = a.badge === 'action' ? 'Action' : a.badge === 'bonus' ? 'Bonus' : 'Passive';
  return `
    <div class="ability-card" data-id="${a.id}" data-key="${key}">
      <div class="ability-top">
        <span class="ability-name">${a.name}</span>
        <span class="ability-badge badge-${a.badge}">${badgeLabel}</span>
      </div>
      <p class="ability-desc">${a.desc}</p>
      ${a.stat ? `<span class="ability-stat">${a.stat}</span>` : ''}
    </div>`;
}

// ── RENDER SIMPLE TAB ─────────────────────────────────────────
function renderSimpleTab(tabId, abilityKey, addLabel) {
  const list = document.getElementById(tabId + 'List');
  if (!list) return;
  const c = currentChar();
  const abilities = (c && c.abilities[abilityKey]) || [];

  list.innerHTML = abilities.length === 0
    ? `<div class="empty-state">No ${addLabel.toLowerCase()} added yet.<br>Tap below to add one.</div>`
    : abilities.map(a => renderAbilityCard(a, abilityKey)).join('');

  list.querySelectorAll('.ability-card').forEach(card => {
    card.addEventListener('click', () => {
      const ability = c.abilities[abilityKey].find(a => a.id === card.dataset.id);
      if (ability) openEditSheet(ability, abilityKey);
    });
  });
}

function renderAllSimpleTabs() {
  renderSimpleTab('reaction', 'reaction', 'Reaction');
  renderSimpleTab('defense',  'defense',  'Defense');
  renderSimpleTab('explore',  'explore',  'Out of combat ability');
}

// ── NAV SWITCHING ─────────────────────────────────────────────
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    renderAllSimpleTabs();
  });
});

// ── ACTION BUTTON TAPS ────────────────────────────────────────
document.querySelectorAll('.act-btn').forEach(btn => {
  btn.addEventListener('click', () => openCategorySheet(btn.dataset.category, btn.dataset.type));
});

// ── OPEN CATEGORY SHEET ───────────────────────────────────────
function openCategorySheet(category, type) {
  const cfg       = CATEGORIES[category];
  const key       = category + '_' + type;
  const c         = currentChar();
  const abilities = (c && c.abilities[key]) || [];

  document.getElementById('sheetTitle').innerHTML =
    `<i class="ti ${cfg.icon} ${cfg.color}"></i> ${cfg.label}`;

  const body = document.getElementById('sheetBody');
  body.innerHTML = abilities.length === 0
    ? `<div class="empty-state">No abilities added here yet.</div>`
    : abilities.map(a => renderAbilityCard(a, key)).join('');

  body.innerHTML += `<button class="add-btn" id="sheetAddBtn"><i class="ti ti-plus"></i> Add ${cfg.label} ability</button>`;

  body.querySelectorAll('.ability-card').forEach(card => {
    card.addEventListener('click', () => {
      const ability = c.abilities[key].find(a => a.id === card.dataset.id);
      if (ability) openEditSheet(ability, key);
    });
  });

  document.getElementById('sheetAddBtn').addEventListener('click', () => openAddSheet(key, category));
  openOverlay('overlay');
}

// ── OPEN ADD SHEET ────────────────────────────────────────────
function openAddSheet(key, category) {
  const cfg = CATEGORIES[category];
  document.getElementById('sheetTitle').innerHTML =
    `<i class="ti ti-plus ${cfg.color}"></i> Add ${cfg.label}`;
  document.getElementById('sheetBody').innerHTML = buildForm(null, key);
  attachFormListeners(null, key);
  openOverlay('overlay');
}

// ── OPEN EDIT SHEET ───────────────────────────────────────────
function openEditSheet(ability, key) {
  const catName = key.split('_')[0];
  const cfg     = CATEGORIES[catName] || CATEGORIES['attack'];
  document.getElementById('sheetTitle').innerHTML =
    `<i class="ti ti-edit ${cfg.color}"></i> Edit`;
  document.getElementById('sheetBody').innerHTML = buildForm(ability, key);
  attachFormListeners(ability, key);
  openOverlay('overlay');
}

// ── BUILD ABILITY FORM ────────────────────────────────────────
function buildForm(ability, key) {
  const v = f => ability ? (ability[f] || '') : '';
  const badges = [
    { value: 'action',  label: 'Action' },
    { value: 'bonus',   label: 'Bonus' },
    { value: 'passive', label: 'Passive' },
  ];
  return `
    <div class="edit-form">
      <div class="form-row">
        <label class="form-label">Name</label>
        <input class="form-input" id="f-name" value="${v('name')}" placeholder="e.g. Handaxe Throw">
      </div>
      <div class="form-row">
        <label class="form-label">Type</label>
        <select class="form-select" id="f-badge">
          ${badges.map(b => `<option value="${b.value}" ${v('badge') === b.value ? 'selected' : ''}>${b.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="f-desc" placeholder="What does this ability do?">${v('desc')}</textarea>
      </div>
      <div class="form-row">
        <label class="form-label">Stats / Damage (optional)</label>
        <input class="form-input" id="f-stat" value="${v('stat')}" placeholder="e.g. 1d6+8 slashing · +8 to hit">
      </div>
      <div class="form-actions">
        ${ability ? `<button class="btn-delete" id="f-delete"><i class="ti ti-trash"></i></button>` : ''}
        <button class="btn-cancel" id="f-cancel">Cancel</button>
        <button class="btn-save"   id="f-save">Save</button>
      </div>
    </div>`;
}

// ── ATTACH ABILITY FORM LISTENERS ─────────────────────────────
function attachFormListeners(ability, key) {
  document.getElementById('f-cancel').addEventListener('click', () => closeOverlay('overlay'));

  document.getElementById('f-save').addEventListener('click', () => {
    const name = document.getElementById('f-name').value.trim();
    if (!name) { document.getElementById('f-name').focus(); return; }

    const entry = {
      id:    ability ? ability.id : 'ab_' + Date.now(),
      name,
      badge: document.getElementById('f-badge').value,
      desc:  document.getElementById('f-desc').value.trim(),
      stat:  document.getElementById('f-stat').value.trim(),
    };

    const c = currentChar();
    if (!c.abilities[key]) c.abilities[key] = [];

    if (ability) {
      const idx = c.abilities[key].findIndex(a => a.id === ability.id);
      if (idx !== -1) c.abilities[key][idx] = entry;
    } else {
      c.abilities[key].push(entry);
    }

    save();
    renderAllSimpleTabs();
    closeOverlay('overlay');
  });

  const delBtn = document.getElementById('f-delete');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      const c = currentChar();
      c.abilities[key] = c.abilities[key].filter(a => a.id !== ability.id);
      save();
      renderAllSimpleTabs();
      closeOverlay('overlay');
    });
  }
}

// ── OVERLAY HELPERS ───────────────────────────────────────────
function openOverlay(id)  { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay(overlay.id);
  });
});

document.getElementById('sheetClose').addEventListener('click', () => closeOverlay('overlay'));

// ── ADD BUTTONS (simple tabs) ─────────────────────────────────
document.querySelectorAll('.add-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => openAddSheet(btn.dataset.tab, btn.dataset.tab));
});

// ── STAT EDIT ─────────────────────────────────────────────────
function openStatSheet() {
  const c = currentChar();
  if (!c) return;
  document.getElementById('statBody').innerHTML = `
    <div class="edit-form">
      <div class="form-row">
        <label class="form-label"><i class="ti ti-user"></i> Character Name</label>
        <input class="form-input" id="s-name" value="${c.name}">
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-id-badge"></i> Subline</label>
        <input class="form-input" id="s-sub" value="${c.sub || ''}">
      </div>
      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label"><i class="ti ti-heart"></i> Max HP</label>
          <input class="stat-edit-input" id="s-hp" type="number" value="${c.hp}">
        </div>
        <div class="form-row">
          <label class="form-label"><i class="ti ti-shield"></i> Armor Class</label>
          <input class="stat-edit-input" id="s-ac" type="number" value="${c.ac}">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label"><i class="ti ti-shoe"></i> Speed</label>
          <input class="stat-edit-input" id="s-speed" value="${c.speed || '30ft'}">
        </div>
        <div class="form-row">
          <label class="form-label"><i class="ti ti-star"></i> Proficiency Bonus</label>
          <input class="stat-edit-input" id="s-prof" value="${c.prof || '+2'}">
        </div>
      </div>
      <div class="form-actions" style="margin-top:4px;">
        <button class="btn-cancel" id="s-cancel">Cancel</button>
        <button class="btn-save"   id="s-save">Save</button>
      </div>
    </div>`;

  document.getElementById('s-cancel').addEventListener('click', () => closeOverlay('statOverlay'));
  document.getElementById('s-save').addEventListener('click', () => {
    c.name  = document.getElementById('s-name').value.trim()  || c.name;
    c.sub   = document.getElementById('s-sub').value.trim()   || c.sub;
    c.hp    = parseInt(document.getElementById('s-hp').value)  || c.hp;
    c.ac    = parseInt(document.getElementById('s-ac').value)  || c.ac;
    c.speed = document.getElementById('s-speed').value.trim() || c.speed;
    c.prof  = document.getElementById('s-prof').value.trim()  || c.prof;
    save();
    renderHeader();
    closeOverlay('statOverlay');
  });

  openOverlay('statOverlay');
}

document.getElementById('hpPill').addEventListener('click',    openStatSheet);
document.getElementById('acPill').addEventListener('click',    openStatSheet);
document.getElementById('speedPill').addEventListener('click', openStatSheet);
document.getElementById('profPill').addEventListener('click',  openStatSheet);
document.getElementById('statClose').addEventListener('click', () => closeOverlay('statOverlay'));

// ── CHARACTER SWITCHER ────────────────────────────────────────
function renderCharSwitcher() {
  const body = document.getElementById('charBody');

  body.innerHTML = characters.map(c => `
    <div class="char-list-item" data-id="${c.id}">
      <div class="char-list-avatar"><i class="ti ti-user"></i></div>
      <div class="char-list-info">
        <div class="char-list-name">${c.name}</div>
        <div class="char-list-sub">${c.sub || ''}</div>
      </div>
      <div class="char-list-actions">
        ${c.id === currentCharId ? '<div class="char-list-check"><i class="ti ti-check"></i></div>' : ''}
        <button class="char-delete-btn" data-id="${c.id}" aria-label="Delete ${c.name}">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>`).join('');

  body.innerHTML += `<button class="new-char-btn" id="newCharBtn"><i class="ti ti-plus"></i> New Character</button>`;

  // Select character
  body.querySelectorAll('.char-list-item').forEach(item => {
    item.addEventListener('click', e => {
      // Don't trigger if delete button was clicked
      if (e.target.closest('.char-delete-btn')) return;
      currentCharId = item.dataset.id;
      save();
      renderHeader();
      renderAllSimpleTabs();
      closeOverlay('charOverlay');
    });
  });

  // Delete character
  body.querySelectorAll('.char-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id   = btn.dataset.id;
      const char = characters.find(c => c.id === id);
      if (!char) return;

      if (!confirm(`Delete "${char.name}"? This cannot be undone.`)) return;

      characters = characters.filter(c => c.id !== id);

      // If we deleted the active character, switch to first remaining
      if (currentCharId === id) {
        currentCharId = characters.length > 0 ? characters[0].id : null;
      }

      save();

      if (characters.length === 0) {
        closeOverlay('charOverlay');
        showWelcome();
      } else {
        renderHeader();
        renderAllSimpleTabs();
        renderCharSwitcher(); // refresh the list in place
      }
    });
  });

  document.getElementById('newCharBtn').addEventListener('click', () => {
    closeOverlay('charOverlay');
    openNewCharSheet(false);
  });
}

document.getElementById('avatarBtn').addEventListener('click', () => {
  renderCharSwitcher();
  openOverlay('charOverlay');
});
document.getElementById('charClose').addEventListener('click', () => closeOverlay('charOverlay'));

// ── INIT ──────────────────────────────────────────────────────
if (characters.length === 0) {
  showWelcome();
} else {
  if (!currentCharId || !characters.find(c => c.id === currentCharId)) {
    currentCharId = characters[0].id;
  }
  hideWelcome();
  renderHeader();
  renderAllSimpleTabs();
}

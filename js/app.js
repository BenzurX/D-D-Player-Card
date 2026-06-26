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

function blankSpellSlots() {
  const s = {};
  for (let i = 1; i <= 9; i++) s[i] = { max: 0, used: 0 };
  return s;
}

const SLOT_ORDINALS = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];

function blankAbilities() {
  return {
    attack_action: [], magic_action: [], items_action: [], features_action: [],
    attack_bonus:  [], magic_bonus:  [], items_bonus:  [], features_bonus:  [],
    reaction: [],
  };
}

// ── CATEGORY CONFIG ───────────────────────────────────────────
// Used by openCategorySheet, openAddSheet, and openEditSheet
const CATEGORIES = {
  attack:   { icon: 'ti-sword',    color: 'c-red',    label: 'Attack' },
  magic:    { icon: 'ti-wand',     color: 'c-purple', label: 'Magic' },
  items:    { icon: 'ti-flask-2',  color: 'c-green',  label: 'Items' },
  features: { icon: 'ti-sparkles', color: 'c-amber',  label: 'Features' },
  reaction: { icon: 'ti-bolt',     color: 'c-purple', label: 'Reaction' },
};

// ── EXTRA ACTIONS ─────────────────────────────────────────────
const EXTRA_ACTIONS = {
  dash: {
    icon: 'ti-shoe', color: 'c-blue', label: 'Dash',
    desc: "Gain extra movement equal to your Speed for this turn. With a Speed of 30 ft., for example, you can move up to 60 ft. on your turn. Any increase or decrease to your Speed changes this additional movement by the same amount.",
  },
  dodge: {
    icon: 'ti-run', color: 'c-plum', label: 'Dodge',
    desc: "Until the start of your next turn, Attack Rolls made against you have Disadvantage if you can see the attacker, and you make Dexterity Saving Throws with Advantage. This benefit ends if you have the Incapacitated condition or if your Speed drops to 0.",
  },
  disengage: {
    icon: 'ti-cloud', color: 'c-blue', label: 'Disengage',
    desc: "Your movement does not provoke Opportunity Attacks for the rest of the turn.",
  },
  hide: {
    icon: 'ti-eye-off', color: 'c-slate', label: 'Hide',
    desc: "Make a Dexterity (Stealth) check to conceal yourself. You must be Heavily Obscured or behind cover and out of any enemy line of sight. On a success, you gain the Invisible condition. The DCs of Perception checks made to find you equal your Stealth check total.",
  },
  help: {
    icon: 'ti-heart-handshake', color: 'c-sage', label: 'Help',
    desc: "Choose one of your allies and a task. Until the start of your next turn, that ally has Advantage on the first ability check they make for that task. Alternatively, choose an ally and a creature within 5 ft. of you both — until the start of your next turn, that ally has Advantage on their first attack roll against that creature.",
  },
  ready: {
    icon: 'ti-clock-pause', color: 'c-gold', label: 'Ready',
    desc: "Decide on a perceivable trigger and the action or movement you will take in response. When the trigger occurs before the start of your next turn, you can use your Reaction to act on it — or ignore it. Taking the Ready action expends your Reaction.",
  },
};

// ── ABILITY SCORE HELPERS ─────────────────────────────────────
function getAbilityMod(score) {
  return Math.floor((score - 10) / 2);
}

const ABILITY_ICON = {
  dex: { icon: 'ti-target-arrow',  cls: 'c-green'  },
  cha: { icon: 'ti-music',         cls: 'c-purple'  },
  int: { icon: 'ti-brain',         cls: 'c-blue'    },
  str: { icon: 'ti-barbell',       cls: 'c-red'     },
  con: { icon: 'ti-heart',         cls: 'c-red'     },
  wis: { icon: 'ti-scale',         cls: 'c-orange'  },
};

function abilityIcon(ab) {
  const a = ABILITY_ICON[ab.toLowerCase()];
  if (!a) return '';
  return `<i class="ti ${a.icon} ${a.cls} skill-ability-icon"></i>`;
}

function modStr(score) {
  const m = getAbilityMod(score);
  return (m >= 0 ? '+' : '') + m;
}

// Ensures a to-hit value is always displayed with an explicit sign (+8, -1, +0).
function normalizeBonus(val) {
  if (!val) return val;
  const s = String(val).trim();
  if (!s || s.startsWith('+') || s.startsWith('-')) return s;
  const n = Number(s);
  return isNaN(n) ? s : (n >= 0 ? '+' : '') + n;
}

// Returns the total skill bonus for a character, accounting for overrides,
// proficiency, and expertise. Used by the skill grid and passive score cards.
function calcSkillBonus(c, skillKey) {
  if (!c) return 0;
  const skill = SKILLS.find(s => s.key === skillKey);
  if (!skill) return 0;
  const over = (c.skillOverrides || {})[skillKey];
  // Explicit null check because 0 is a valid override value
  if (over !== null && over !== undefined) return over;
  const state   = (c.skills || {})[skillKey] || 'none';
  const mod     = getAbilityMod(c[skill.ability] || 10);
  const profNum = parseInt(c.prof || '+2') || 2;
  if (state === 'expert') return mod + profNum * 2;
  if (state === 'prof')   return mod + profNum;
  return mod;
}

// ── SKILLS ───────────────────────────────────────────────────
const SKILLS = [
  { name: 'Acrobatics',      key: 'acrobatics',    ability: 'dex' },
  { name: 'Animal Handling', key: 'animalHandling', ability: 'wis' },
  { name: 'Arcana',          key: 'arcana',         ability: 'int' },
  { name: 'Athletics',       key: 'athletics',      ability: 'str' },
  { name: 'Deception',       key: 'deception',      ability: 'cha' },
  { name: 'History',         key: 'history',        ability: 'int' },
  { name: 'Insight',         key: 'insight',        ability: 'wis' },
  { name: 'Intimidation',    key: 'intimidation',   ability: 'cha' },
  { name: 'Investigation',   key: 'investigation',  ability: 'int' },
  { name: 'Medicine',        key: 'medicine',       ability: 'wis' },
  { name: 'Nature',          key: 'nature',         ability: 'int' },
  { name: 'Perception',      key: 'perception',     ability: 'wis' },
  { name: 'Performance',     key: 'performance',    ability: 'cha' },
  { name: 'Persuasion',      key: 'persuasion',     ability: 'cha' },
  { name: 'Religion',        key: 'religion',       ability: 'int' },
  { name: 'Sleight of Hand', key: 'sleightOfHand',  ability: 'dex' },
  { name: 'Stealth',         key: 'stealth',        ability: 'dex' },
  { name: 'Survival',        key: 'survival',       ability: 'wis' },
];

function blankSkills() {
  const s = {};
  SKILLS.forEach(sk => { s[sk.key] = 'none'; });
  return s;
}

function blankSavingThrows() {
  const st = {};
  ['str','dex','con','int','wis','cha'].forEach(ab => { st[ab] = { prof: false, override: null }; });
  return st;
}

// Shared lookup used by renderDefenseTab and openSaveOverrideSheet
const ABILITY_NAMES = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

function getSaveBonus(c, ability) {
  if (!c) return 0;
  const st      = (c.savingThrows || {})[ability] || { prof: false, override: null };
  if (st.override !== null && st.override !== undefined) return st.override;
  const mod     = getAbilityMod(c[ability] || 10);
  const profNum = parseInt(c.prof || '+2') || 2;
  return st.prof ? mod + profNum : mod;
}

// ── LOADING SCREEN ────────────────────────────────────────────
function hideLoading() {
  const el = document.getElementById('loading');
  el.classList.add('fade-out');
  // If welcome is waiting underneath, cross-fade it in simultaneously
  const wel = document.getElementById('welcome');
  if (wel.style.display !== 'none') {
    requestAnimationFrame(() => wel.classList.add('visible'));
  }
  setTimeout(() => { el.style.display = 'none'; }, 400);
}

// ── WELCOME SCREEN ────────────────────────────────────────────
function showWelcome(immediate = false) {
  document.getElementById('app').style.display = 'none';
  const wel = document.getElementById('welcome');
  wel.style.display = 'flex';
  // immediate=true for post-delete reveal; false when loading screen will cross-fade it in
  if (immediate) requestAnimationFrame(() => wel.classList.add('visible'));
}

function hideWelcome() {
  const wel = document.getElementById('welcome');
  wel.classList.remove('visible');
  wel.style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

document.getElementById('welcomeCreate').addEventListener('click', () => {
  openNewCharSheet(true);
});

// ── NEW CHARACTER FORM ────────────────────────────────────────
// fromWelcome: true when called from the splash screen — hides welcome on success
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

      <div class="section-lbl">Ability Scores</div>
      <div class="form-row-3">
        <div class="form-row">
          <label class="form-label">STR</label>
          <input class="form-input" id="nc-str" type="number" min="1" max="30" placeholder="10">
          <div class="ability-mod" id="nc-str-mod">+0</div>
        </div>
        <div class="form-row">
          <label class="form-label">DEX</label>
          <input class="form-input" id="nc-dex" type="number" min="1" max="30" placeholder="10">
          <div class="ability-mod" id="nc-dex-mod">+0</div>
        </div>
        <div class="form-row">
          <label class="form-label">CON</label>
          <input class="form-input" id="nc-con" type="number" min="1" max="30" placeholder="10">
          <div class="ability-mod" id="nc-con-mod">+0</div>
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-row">
          <label class="form-label">INT</label>
          <input class="form-input" id="nc-int" type="number" min="1" max="30" placeholder="10">
          <div class="ability-mod" id="nc-int-mod">+0</div>
        </div>
        <div class="form-row">
          <label class="form-label">WIS</label>
          <input class="form-input" id="nc-wis" type="number" min="1" max="30" placeholder="10">
          <div class="ability-mod" id="nc-wis-mod">+0</div>
        </div>
        <div class="form-row">
          <label class="form-label">CHA</label>
          <input class="form-input" id="nc-cha" type="number" min="1" max="30" placeholder="10">
          <div class="ability-mod" id="nc-cha-mod">+0</div>
        </div>
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
    const speed    = document.getElementById('nc-speed').value.trim()   || '30ft';
    const prof     = document.getElementById('nc-prof').value.trim()    || '+2';
    const str      = parseInt(document.getElementById('nc-str').value)  || 10;
    const dex      = parseInt(document.getElementById('nc-dex').value)  || 10;
    const con      = parseInt(document.getElementById('nc-con').value)  || 10;
    const intScore = parseInt(document.getElementById('nc-int').value)  || 10;
    const wis      = parseInt(document.getElementById('nc-wis').value)  || 10;
    const cha      = parseInt(document.getElementById('nc-cha').value)  || 10;

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
      level: level || '',
      cls:   cls   || '',
      species: species || '',
      hp, ac, speed, prof,
      str, dex, con, int: intScore, wis, cha,
      skills: blankSkills(),
      skillAdv: {},
      savingThrows: blankSavingThrows(),
      resistances: [],
      immunities: [],
      abilities: blankAbilities(),
      spellSlots: blankSpellSlots(),
    });
    currentCharId = id;
    save();

    closeOverlay('newCharOverlay');
    if (fromWelcome) hideWelcome();
    renderHeader();
    renderAllSimpleTabs();
  });

  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
    const input = document.getElementById(`nc-${ab}`);
    const mod   = document.getElementById(`nc-${ab}-mod`);
    if (input && mod) {
      input.addEventListener('input', () => {
        mod.textContent = modStr(parseInt(input.value) || 10);
      });
    }
  });

  openOverlay('newCharOverlay');
}

document.getElementById('newCharClose').addEventListener('click', () => closeOverlay('newCharOverlay'));

// ── RENDER HEADER ─────────────────────────────────────────────
function renderHeader() {
  const c = currentChar();
  if (!c) return;
  document.getElementById('charName').textContent = c.name;
  const subParts = [
    c.level   ? `Lvl ${c.level}` : null,
    c.species || null,
    c.cls     || null,
  ].filter(Boolean);
  document.getElementById('charSub').textContent = subParts.join(' · ') || c.sub || '';
  const avatarBtn = document.getElementById('avatarBtn');
  avatarBtn.innerHTML = c.avatar
    ? `<img src="${c.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : `<i class="ti ti-user"></i>`;
}

// ── RENDER ABILITY CARD HTML ──────────────────────────────────
function renderAbilityCard(a, key) {
  const category = key.split('_')[0];
  let badgeLabel;
  if (category === 'attack') {
    badgeLabel = a.badge === 'melee' ? 'Melee' : a.badge === 'ranged' ? 'Ranged' : 'Thrown';
  } else if (category === 'magic') {
    const magicLabels = { spell: 'Spell', 'spell-attack': 'Spell Attack', buff: 'Buff', ability: 'Ability' };
    badgeLabel = magicLabels[a.badge] || 'Spell';
  } else if (category === 'features') {
    const featLabels = { feat: 'Feat', origin: 'Origin', species: 'Species' };
    badgeLabel = featLabels[a.badge] || 'Feat';
  } else {
    badgeLabel = a.badge === 'action' ? 'Action' : a.badge === 'bonus' ? 'Bonus' : 'Passive';
  }

  let statsHTML = '';
  if (category === 'attack') {
    const chips = [
      a.toHit  ? `<span class="ability-chip">${normalizeBonus(a.toHit)} to hit</span>` : '',
      a.damage ? `<span class="ability-chip">${a.damage}</span>` : '',
      a.range  ? `<span class="ability-chip">${a.range}</span>` : '',
    ].filter(Boolean);
    if (chips.length) statsHTML = `<div class="ability-chips">${chips.join('')}</div>`;
  } else if (category === 'magic') {
    const chips = [
      a.spellLevel    ? `<span class="ability-chip ability-chip-purple">${a.spellLevel}</span>` : '',
      a.concentration ? `<span class="ability-chip ability-chip-conc">Conc.</span>` : '',
      a.duration      ? `<span class="ability-chip">${a.duration}</span>` : '',
      a.saveOrAttack  ? `<span class="ability-chip">${a.saveOrAttack}</span>` : '',
      a.damage        ? `<span class="ability-chip">${a.damage}</span>` : '',
      a.range         ? `<span class="ability-chip">${a.range}</span>` : '',
    ].filter(Boolean);
    if (chips.length) statsHTML = `<div class="ability-chips">${chips.join('')}</div>`;
  } else if (a.stat) {
    statsHTML = `<span class="ability-stat">${a.stat}</span>`;
  }

  return `
    <div class="ability-card" data-id="${a.id}" data-key="${key}">
      <div class="ability-top">
        <span class="ability-name">${a.name}</span>
        ${category !== 'reaction' ? `<span class="ability-badge badge-${a.badge}">${badgeLabel}</span>` : ''}
      </div>
      ${a.desc ? `<p class="ability-desc">${a.desc}</p>` : ''}
      ${statsHTML}
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
  renderActTab();
  renderSimpleTab('reaction', 'reaction', 'Reaction');
  renderDefenseTab();
  renderExploreTab();
}

// ── RENDER ACT TAB ────────────────────────────────────────────
function renderActTab() {
  const tab = document.getElementById('tab-act');
  const c   = currentChar();

  const ACTION_KEYS = ['attack_action','magic_action','items_action','features_action'];
  const BONUS_KEYS  = ['attack_bonus', 'magic_bonus', 'items_bonus', 'features_bonus'];

  const pinnedActions = [];
  const pinnedBonus   = [];
  if (c) {
    ACTION_KEYS.forEach(key => (c.abilities[key] || []).filter(a => a.pinned).forEach(a => pinnedActions.push({ a, key })));
    BONUS_KEYS.forEach(key  => (c.abilities[key] || []).filter(a => a.pinned).forEach(a => pinnedBonus.push({ a, key })));
  }

  function pinnedRowHTML({ a, key }) {
    const cat = key.split('_')[0];
    const cfg = CATEGORIES[cat];

    const attackLabels = { melee: 'Melee', ranged: 'Ranged', thrown: 'Thrown' };
    const magicLabels  = { spell: 'Spell', 'spell-attack': 'Spell Attack', buff: 'Buff', ability: 'Ability' };
    const subtype = cat === 'attack' ? (attackLabels[a.badge] || '')
                  : cat === 'magic'  ? (magicLabels[a.badge]  || '')
                  : '';

    const isBonus = key.endsWith('_bonus');
    const actionLabel = isBonus ? 'Bonus Action' : '';

    // Flat layout for features/items (no structured stats)
    if (cat !== 'attack' && cat !== 'magic') {
      const flatSubtype = actionLabel;
      const flatCapNum  = a.stat || '';
      const featIcons   = { feat: 'ti-bookmark', origin: 'ti-origin', species: 'ti-user-hexagon' };
      const featIcon    = cat === 'features' ? (featIcons[a.badge] || '') : '';
      const showCap     = isBonus && cat !== 'features';
      return `<div class="pinned-row pinned-row-flat" data-id="${a.id}" data-key="${key}">
        <div class="pinned-row-left">
          <i class="ti ${cfg.icon} ${cfg.color} pinned-icon"></i>
          <div class="pinned-name-group">
            <span class="pinned-name">${a.name}</span>
            ${flatSubtype ? `<span class="pinned-subtype">${flatSubtype}</span>` : ''}
          </div>
        </div>
        ${featIcon ? `<i class="ti ${featIcon} pinned-feat-icon"></i>`
                   : showCap ? `<div class="pinned-row-cap"><span class="pinned-cap-num">${flatCapNum || 'B.A.'}</span></div>`
                   : ''}
      </div>`;
    }

    // Left-side stat (to-hit or save)
    const statNum = cat === 'attack' ? normalizeBonus(a.toHit || '') : (a.saveOrAttack || '');
    const statLbl = cat === 'attack' && a.toHit ? 'TO HIT' : '';

    // Right end cap (damage split into roll + type)
    let capNum = '', capLbl = '';
    if (a.damage) {
      const parts = a.damage.trim().split(/\s+/);
      capNum = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
      capLbl = parts.length > 1 ? parts[parts.length - 1] : '';
    } else if (cat === 'magic' && a.spellLevel) {
      capNum = a.spellLevel;
    }

    const hasEndCap = !!capNum;
    const combinedSubtype = [subtype, actionLabel].filter(Boolean).join(' · ');

    return `<div class="pinned-row" data-id="${a.id}" data-key="${key}">
      <div class="pinned-row-left">
        <i class="ti ${cfg.icon} ${cfg.color} pinned-icon"></i>
        <div class="pinned-name-group">
          <span class="pinned-name">${a.name}</span>
          ${combinedSubtype ? `<span class="pinned-subtype">${combinedSubtype}</span>` : ''}
        </div>
        ${statNum ? `<div class="pinned-tohit">
          <span class="pinned-tohit-num">${statNum}</span>
          ${statLbl ? `<span class="pinned-tohit-lbl">${statLbl}</span>` : ''}
        </div>` : ''}
      </div>
      ${hasEndCap ? `<div class="pinned-row-cap">
        <span class="pinned-cap-num">${capNum}</span>
        ${capLbl ? `<span class="pinned-cap-lbl">${capLbl}</span>` : ''}
      </div>` : ''}
    </div>`;
  }

  // Spell slots
  const slots = (c && c.spellSlots) || {};
  const activeSlots = SLOT_ORDINALS
    .map((ord, i) => ({ ord, level: i + 1, max: 0, used: 0, ...(slots[i + 1] || {}) }))
    .filter(s => s.max > 0);

  const anySlotUsed = activeSlots.some(s => s.used > 0);
  const slotsHTML = activeSlots.length ? `
    <div class="section-hdr section-gap section-hdr-row"><span>Spell Slots</span><button class="long-rest-btn${anySlotUsed ? ' slots-active' : ''}" id="longRestBtn"><i class="ti ${anySlotUsed ? 'ti-moon-filled' : 'ti-moon'}"></i></button></div>
    <div class="slot-tracker">
      ${activeSlots.map(s => {
        const pips = Array.from({ length: s.max }, (_, i) => {
          const isUsed = i < s.used;
          return `<button class="slot-pip${isUsed ? ' filled' : ''}" data-level="${s.level}" data-index="${i}"><i class="ti ${isUsed ? 'ti-circle-filled' : 'ti-circle'}"></i></button>`;
        }).join('');
        return `<div class="slot-row"><span class="slot-label">${s.ord}</span><div class="slot-pips">${pips}</div></div>`;
      }).join('')}
    </div>` : '';

  const hasAbove = pinnedActions.length || pinnedBonus.length || activeSlots.length;
  const attacks  = (c && c.attacksPerRound) || 1;

  tab.innerHTML = `
    ${pinnedActions.length ? `
      <div class="section-hdr section-hdr-row"><span>Pinned Actions</span><span class="attacks-badge">× ${attacks === 1 ? '1 Attack' : attacks + ' Attacks'} <i class="ti ti-sword"></i></span></div>
      <div class="pinned-list">${pinnedActions.map(pinnedRowHTML).join('')}</div>` : ''}
    ${pinnedBonus.length ? `
      <div class="section-hdr${pinnedActions.length ? ' section-gap' : ''}">Pinned Bonus Actions</div>
      <div class="pinned-list">${pinnedBonus.map(pinnedRowHTML).join('')}</div>` : ''}
    ${slotsHTML}
    <div class="section-hdr${hasAbove ? ' section-gap' : ''}">Actions</div>
    <div class="btn-grid">
      <div class="act-btn" data-category="attack"   data-type="action"><i class="ti ti-sword    c-red    cat-i"></i><div class="btn-text"><span class="btn-name">Attack</span>   <span class="btn-desc">Weapon Attacks</span></div></div>
      <div class="act-btn" data-category="magic"    data-type="action"><i class="ti ti-wand     c-purple cat-i"></i><div class="btn-text"><span class="btn-name">Magic</span>    <span class="btn-desc">Magic Missile</span></div></div>
      <div class="act-btn" data-category="items"    data-type="action"><i class="ti ti-flask-2  c-green  cat-i"></i><div class="btn-text"><span class="btn-name">Items</span>    <span class="btn-desc">Healing Potion</span></div></div>
      <div class="act-btn" data-category="features" data-type="action"><i class="ti ti-sparkles c-amber  cat-i"></i><div class="btn-text"><span class="btn-name">Features</span> <span class="btn-desc">Action Surge</span></div></div>
    </div>
    <div class="section-hdr section-gap">Bonus Actions</div>
    <div class="btn-grid">
      <div class="act-btn" data-category="attack"   data-type="bonus"><i class="ti ti-sword    c-red    cat-i"></i><div class="btn-text"><span class="btn-name">Attack</span>   <span class="btn-desc">Offhand Attack</span></div></div>
      <div class="act-btn" data-category="magic"    data-type="bonus"><i class="ti ti-wand     c-purple cat-i"></i><div class="btn-text"><span class="btn-name">Magic</span>    <span class="btn-desc">Misty Step</span></div></div>
      <div class="act-btn" data-category="items"    data-type="bonus"><i class="ti ti-flask-2  c-green  cat-i"></i><div class="btn-text"><span class="btn-name">Items</span>    <span class="btn-desc">Quick Use Item</span></div></div>
      <div class="act-btn" data-category="features" data-type="bonus"><i class="ti ti-sparkles c-amber  cat-i"></i><div class="btn-text"><span class="btn-name">Features</span> <span class="btn-desc">Bonus Abilities</span></div></div>
    </div>
    <div class="section-hdr section-gap">Extra Actions</div>
    <div class="btn-grid">
      <div class="act-btn extra-act" data-extra="dash">      <i class="ti ti-shoe            c-blue   cat-i"></i><div class="btn-text"><span class="btn-name">Dash</span>      <span class="btn-desc">Double Movement</span></div></div>
      <div class="act-btn extra-act" data-extra="dodge">     <i class="ti ti-run             c-plum   cat-i"></i><div class="btn-text"><span class="btn-name">Dodge</span>     <span class="btn-desc">Avoid Attacks</span></div></div>
      <div class="act-btn extra-act" data-extra="disengage"> <i class="ti ti-cloud           c-blue   cat-i"></i><div class="btn-text"><span class="btn-name">Disengage</span> <span class="btn-desc">No Opp. Attacks</span></div></div>
      <div class="act-btn extra-act" data-extra="hide">      <i class="ti ti-eye-off         c-slate  cat-i"></i><div class="btn-text"><span class="btn-name">Hide</span>      <span class="btn-desc">Stealth Check</span></div></div>
      <div class="act-btn extra-act" data-extra="help">      <i class="ti ti-heart-handshake c-sage   cat-i"></i><div class="btn-text"><span class="btn-name">Help</span>      <span class="btn-desc">Give Ally Advantage</span></div></div>
      <div class="act-btn extra-act" data-extra="ready">     <i class="ti ti-clock-pause     c-orange cat-i"></i><div class="btn-text"><span class="btn-name">Ready</span>     <span class="btn-desc">Hold Action</span></div></div>
    </div>`;

  tab.querySelectorAll('.act-btn:not(.extra-act)').forEach(btn => {
    btn.addEventListener('click', () => openCategorySheet(btn.dataset.category, btn.dataset.type));
  });
  tab.querySelectorAll('.extra-act').forEach(btn => {
    btn.addEventListener('click', () => openExtraActionSheet(btn.dataset.extra));
  });
  tab.querySelectorAll('.pinned-row').forEach(row => {
    row.addEventListener('click', () => {
      const ability = (c.abilities[row.dataset.key] || []).find(a => a.id === row.dataset.id);
      if (ability) openEditSheet(ability, row.dataset.key);
    });
  });
  tab.querySelectorAll('.slot-pip').forEach(pip => {
    pip.addEventListener('click', () => {
      if (!c) return;
      const level = parseInt(pip.dataset.level);
      const index = parseInt(pip.dataset.index);
      if (!c.spellSlots) c.spellSlots = blankSpellSlots();
      const slot = c.spellSlots[level];
      if (!slot) return;
      slot.used = index < slot.used ? index : index + 1;
      save();
      renderActTab();
    });
    pip.addEventListener('mouseenter', () => {
      if (pip.classList.contains('filled')) return;
      const index = parseInt(pip.dataset.index);
      pip.closest('.slot-pips').querySelectorAll('.slot-pip').forEach(p => {
        if (!p.classList.contains('filled') && parseInt(p.dataset.index) <= index)
          p.classList.add('pip-preview');
      });
    });
    pip.addEventListener('mouseleave', () => {
      pip.closest('.slot-pips').querySelectorAll('.slot-pip').forEach(p => p.classList.remove('pip-preview'));
    });
  });
  const longRestBtn = tab.querySelector('#longRestBtn');
  if (longRestBtn) {
    longRestBtn.addEventListener('click', () => {
      if (!c) return;
      if (!c.spellSlots) c.spellSlots = blankSpellSlots();
      Object.values(c.spellSlots).forEach(s => { s.used = 0; });
      save();
      renderActTab();
    });
  }
}

// ── RENDER EXPLORE TAB ────────────────────────────────────────
function renderExploreTab() {
  const tab = document.getElementById('tab-explore');
  const c   = currentChar();

  const skillData      = (c && c.skills)         || {};
  const skillOverrides = (c && c.skillOverrides)  || {};

  function profIcon(state) {
    if (state === 'expert') return 'ti-star-filled';
    if (state === 'prof')   return 'ti-circle-filled';
    return 'ti-circle';
  }

  // ── Character info cards ──────────────────────────────────

  const walkVal    = c && c.speed      ? c.speed      : '30 ft';
  const walkNum    = parseInt((walkVal.match(/\d+/) || ['30'])[0]);
  const halfWalkFt = Math.floor(walkNum / 2) + ' ft';
  const flyVal     = c && c.flySpeed   ? c.flySpeed   : null;
  const climbVal   = c && c.climbSpeed ? c.climbSpeed : null;
  const swimVal    = c && c.swimSpeed  ? c.swimSpeed  : null;
  const climbDef   = !climbVal;
  const swimDef    = !swimVal;

  // ── Passive scores ────────────────────────────────────────
  const passiveOvr  = (c && c.passiveOverrides) || {};
  const passPercOver = passiveOvr.perception    != null;
  const passInvOver  = passiveOvr.investigation != null;
  const passInsOver  = passiveOvr.insight       != null;
  const passPerc = passPercOver ? passiveOvr.perception    : 10 + calcSkillBonus(c, 'perception');
  const passInv  = passInvOver  ? passiveOvr.investigation : 10 + calcSkillBonus(c, 'investigation');
  const passIns  = passInsOver  ? passiveOvr.insight       : 10 + calcSkillBonus(c, 'insight');

  // ── Skills ───────────────────────────────────────────────
  const skillAdvData = (c && c.skillAdv) || {};
  const skillsHTML = SKILLS.map(skill => {
    const state    = skillData[skill.key] || 'none';
    const hasOver  = skillOverrides[skill.key] !== null && skillOverrides[skill.key] !== undefined;
    const bonus    = calcSkillBonus(c, skill.key);
    const bonusStr = (bonus >= 0 ? '+' : '') + bonus;
    const adv      = skillAdvData[skill.key] || 'none';
    const advIcon  = adv === 'adv'    ? `<span class="adv-badge adv-badge-adv">A</span>`
                   : adv === 'disadv' ? `<span class="adv-badge adv-badge-disadv">D</span>`
                   : '';
    return `
      <div class="skill-row" data-skill="${skill.key}">
        <button class="prof-toggle ${state}" data-skill="${skill.key}" aria-label="Toggle ${skill.name} proficiency">
          <i class="ti ${profIcon(state)}"></i>
        </button>
        <div class="skill-info">
          <span class="skill-name">${skill.name}</span>
          <span class="skill-ability">${abilityIcon(skill.ability)}${skill.ability.toUpperCase()}</span>
        </div>
        ${advIcon}
        <div class="skill-bonus${state !== 'none' && !hasOver ? ' is-prof' : ''}${hasOver ? ' is-override' : ''}">${bonusStr}${hasOver ? '*' : ''}</div>
      </div>`;
  }).join('');

  tab.innerHTML = `
    <div class="section-hdr">Character</div>
    <div class="defense-summary">
      <div class="defense-tags-col explore-tappable" id="explore-speed-card">
        <div class="defense-tags-section-lbl">Movement</div>
        <div class="move-rows">
          <div class="move-row">
            <span class="move-type"><i class="ti ti-shoe c-blue"></i> Walk</span>
            <span class="move-dots"></span>
            <span class="move-val">${walkVal}</span>
          </div>
          <div class="move-row">
            <span class="move-type"><i class="ti ti-feather c-blue"></i> Fly</span>
            <span class="move-dots"></span>
            <span class="move-val${flyVal ? '' : ' move-val-none'}">${flyVal || '—'}</span>
          </div>
          <div class="move-row">
            <span class="move-type"><i class="ti ti-mountain c-blue"></i> Climb</span>
            <span class="move-dots"></span>
            <span class="move-val${climbDef ? ' move-val-default' : ''}">${climbVal || halfWalkFt}</span>
          </div>
          <div class="move-row">
            <span class="move-type"><i class="ti ti-ripple c-blue"></i> Swim</span>
            <span class="move-dots"></span>
            <span class="move-val${swimDef ? ' move-val-default' : ''}">${swimVal || halfWalkFt}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-hdr">Passive Scores</div>
    <div class="passive-row" id="passiveRow">
      <div class="passive-card tappable">
        <div class="passive-top"><i class="ti ti-eye c-blue passive-icon"></i><div class="passive-val${passPercOver ? ' is-override' : ''}">${passPerc}</div></div>
        <div class="passive-label">Perception</div>
      </div>
      <div class="passive-card tappable">
        <div class="passive-top"><i class="ti ti-zoom-question c-green passive-icon"></i><div class="passive-val${passInvOver ? ' is-override' : ''}">${passInv}</div></div>
        <div class="passive-label">Investigation</div>
      </div>
      <div class="passive-card tappable">
        <div class="passive-top"><i class="ti ti-bulb c-amber passive-icon"></i><div class="passive-val${passInsOver ? ' is-override' : ''}">${passIns}</div></div>
        <div class="passive-label">Insight</div>
      </div>
    </div>

    <div class="section-hdr">Skills</div>
    <div class="skill-grid">${skillsHTML}</div>
    <div class="skill-legend">
      <span><i class="ti ti-circle"></i> None</span>
      <span><i class="ti ti-circle-filled c-gold"></i> Proficient</span>
      <span><i class="ti ti-star-filled c-gold"></i> Expertise</span>
    </div>`;

  document.getElementById('explore-speed-card').addEventListener('click', () => openCharacterDetailsSheet());
  document.getElementById('passiveRow').querySelectorAll('.passive-card').forEach(card => {
    card.addEventListener('click', () => openPassiveScoresSheet());
  });

  tab.querySelectorAll('.prof-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!c) return;
      const key     = btn.dataset.skill;
      const current = (c.skills || {})[key] || 'none';
      const next    = current === 'none' ? 'prof' : current === 'prof' ? 'expert' : 'none';
      if (!c.skills) c.skills = {};
      c.skills[key] = next;
      save();
      renderExploreTab();
    });
  });

  tab.querySelectorAll('.skill-grid .skill-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.prof-toggle')) return;
      openSkillOverrideSheet(row.dataset.skill);
    });
  });
}

// ── RENDER DEFENSE TAB ───────────────────────────────────────
function renderDefenseTab() {
  const tab = document.getElementById('tab-defense');
  const c   = currentChar();

  const saves = (c && c.savingThrows) || {};

  const saveRows = ['str','int','dex','wis','con','cha'].map(ab => {
    const st      = saves[ab] || { prof: false, override: null };
    const isProf  = !!st.prof;
    const hasOver = st.override !== null && st.override !== undefined;
    const bonus   = getSaveBonus(c, ab);
    const bStr    = (bonus >= 0 ? '+' : '') + bonus;
    const adv     = st.adv || 'none';
    const advIcon = adv === 'adv'    ? `<span class="adv-badge adv-badge-adv">A</span>`
                  : adv === 'disadv' ? `<span class="adv-badge adv-badge-disadv">D</span>`
                  : '';
    return `
      <div class="skill-row save-row" data-ability="${ab}">
        <button class="prof-toggle${isProf ? ' prof' : ''}" data-save="${ab}" aria-label="Toggle ${ABILITY_NAMES[ab]} save proficiency">
          <i class="ti ${isProf ? 'ti-circle-filled' : 'ti-circle'}"></i>
        </button>
        <div class="skill-info">
          <span class="skill-name">${abilityIcon(ab)} ${ABILITY_NAMES[ab]}</span>
        </div>
        ${advIcon}
        <div class="skill-bonus${isProf ? ' is-prof' : ''}${hasOver ? ' is-override' : ''}">${bStr}${hasOver ? '*' : ''}</div>
      </div>`;
  }).join('');

  const resistances = (c && c.resistances) || [];
  const immunities  = (c && c.immunities)  || [];

  function chipsHTML(arr, type) {
    if (arr.length === 0) return `<p style="color:var(--ink-faint);font-style:italic;padding:8px 0 4px;font-size:var(--text-base);">None added yet.</p>`;
    return `<div class="resist-chips">${arr.map((r, i) =>
      `<div class="resist-chip"><span class="resist-chip-label" data-type="${type}" data-index="${i}">${r}</span><button class="resist-chip-remove" data-type="${type}" data-index="${i}" aria-label="Remove ${r}"><i class="ti ti-x"></i></button></div>`
    ).join('')}</div>`;
  }

  const resistTags = resistances.map(r => `<div class="def-tag def-tag-resist">${r}</div>`).join('');
  const immuneTags = immunities.map(im => `<div class="def-tag def-tag-immune">${im}</div>`).join('');
  const noTags     = !resistances.length && !immunities.length;

  tab.innerHTML = `
    <div class="defense-summary">
      <div class="defense-ac">
        <i class="ti ti-shield-half"></i>
        <div class="defense-ac-val">${c && c.ac ? c.ac : '—'}</div>
        <div class="defense-ac-lbl">AC</div>
      </div>
      <div class="defense-tags-col">
        ${noTags ? `<span style="color:var(--ink-faint);font-style:italic;font-size:var(--text-sm);">No resistances<br>or immunities.</span>` : ''}
        ${resistTags ? `<div><div class="defense-tags-section-lbl">Resist</div><div class="defense-tags">${resistTags}</div></div>` : ''}
        ${immuneTags ? `<div><div class="defense-tags-section-lbl">Immune</div><div class="defense-tags">${immuneTags}</div></div>` : ''}
      </div>
    </div>

    <div class="section-hdr">Saving Throws</div>
    <div class="skill-grid" id="saveList">${saveRows}</div>
    <div class="skill-legend">
      <span><i class="ti ti-circle"></i> None</span>
      <span><i class="ti ti-circle-filled c-gold"></i> Proficient</span>
    </div>

    <div class="section-hdr section-gap">Resistances</div>
    <div id="resistList">${chipsHTML(resistances, 'resistances')}</div>
    <button class="add-btn" id="addResistBtn"><i class="ti ti-plus"></i> Add Resistance</button>

    <div class="section-hdr section-gap">Immunities</div>
    <div id="immunityList">${chipsHTML(immunities, 'immunities')}</div>
    <button class="add-btn" id="addImmunityBtn"><i class="ti ti-plus"></i> Add Immunity</button>`;

  tab.querySelectorAll('.prof-toggle[data-save]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!c) return;
      if (!c.savingThrows) c.savingThrows = blankSavingThrows();
      const ab = btn.dataset.save;
      if (!c.savingThrows[ab]) c.savingThrows[ab] = { prof: false, override: null };
      c.savingThrows[ab].prof = !c.savingThrows[ab].prof;
      save();
      renderDefenseTab();
    });
  });

  tab.querySelectorAll('.save-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.prof-toggle')) return;
      openSaveOverrideSheet(row.dataset.ability);
    });
  });

  tab.querySelectorAll('.resist-chip-label').forEach(lbl => {
    lbl.addEventListener('click', () => {
      openAddResistanceSheet(lbl.dataset.type, parseInt(lbl.dataset.index));
    });
  });
  tab.querySelectorAll('.resist-chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!c) return;
      const type  = btn.dataset.type;
      const index = parseInt(btn.dataset.index);
      if (!c[type]) c[type] = [];
      c[type].splice(index, 1);
      save();
      renderDefenseTab();
    });
  });

  document.getElementById('addResistBtn').addEventListener('click', () => openAddResistanceSheet('resistances'));
  document.getElementById('addImmunityBtn').addEventListener('click', () => openAddResistanceSheet('immunities'));
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

// ── PIN BUTTON HELPERS ────────────────────────────────────────
function resetSheetPin() {
  const btn = document.getElementById('sheetPin');
  btn.style.display = 'none';
  btn.onclick = null;
}

function showSheetPin(ability, key) {
  const btn = document.getElementById('sheetPin');
  btn.style.display = '';
  const update = () => {
    btn.innerHTML = ability.pinned
      ? `<i class="ti ti-pin-filled c-gold"></i>`
      : `<i class="ti ti-pin"></i>`;
  };
  update();
  btn.onclick = () => {
    const c = currentChar();
    const a = (c.abilities[key] || []).find(a => a.id === ability.id);
    if (!a) return;
    a.pinned = !a.pinned;
    save();
    renderActTab();
    update();
  };
}

// ── OPEN CATEGORY SHEET ───────────────────────────────────────
function openCategorySheet(category, type) {
  resetSheetPin();
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

  const addBtnLabel = category === 'magic' ? 'Add Spell or Ability' : `Add ${cfg.label} ability`;
  body.innerHTML += `<button class="add-btn" id="sheetAddBtn"><i class="ti ti-plus"></i> ${addBtnLabel}</button>`;

  body.querySelectorAll('.ability-card').forEach(card => {
    card.addEventListener('click', () => {
      const ability = c.abilities[key].find(a => a.id === card.dataset.id);
      if (ability) openEditSheet(ability, key);
    });
  });

  document.getElementById('sheetAddBtn').addEventListener('click', () => openAddSheet(key, category));
  openOverlay('overlay');
}

// ── OPEN EXTRA ACTION SHEET ───────────────────────────────────
function openExtraActionSheet(key) {
  resetSheetPin();
  const cfg = EXTRA_ACTIONS[key];
  document.getElementById('sheetTitle').innerHTML =
    `<i class="ti ${cfg.icon} ${cfg.color}"></i> ${cfg.label}`;
  document.getElementById('sheetBody').innerHTML =
    `<p class="ability-desc" style="padding-top:4px;">${cfg.desc}</p>`;
  openOverlay('overlay');
}

// ── OPEN SAVE OVERRIDE SHEET ──────────────────────────────────
function openSaveOverrideSheet(ability) {
  const c = currentChar();
  const st      = (c && c.savingThrows && c.savingThrows[ability]) || { prof: false, override: null };
  const hasOver = st.override !== null && st.override !== undefined;
  const mod     = getAbilityMod((c && c[ability]) || 10);
  const profNum = parseInt((c && c.prof) || '+2') || 2;
  const autoVal = st.prof ? mod + profNum : mod;
  const autoStr = (autoVal >= 0 ? '+' : '') + autoVal;
  const saveAdv = st.adv || 'none';

  document.getElementById('sheetTitle').innerHTML =
    `${abilityIcon(ability)} ${ABILITY_NAMES[ability]} Saving Throw`;
  const isProf = !!st.prof;
  document.getElementById('sheetBody').innerHTML = `
    <div class="edit-form">
      <div class="form-row">
        <label class="form-label">Proficiency</label>
        <div class="prof-seg" id="save-prof-seg">
          <button class="prof-seg-btn${!isProf ? ' active' : ''}" data-state="none">None</button>
          <button class="prof-seg-btn${isProf  ? ' active' : ''}" data-state="prof"><i class="ti ti-circle-filled"></i> Proficient</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Advantage</label>
        <div class="prof-seg" id="save-adv-seg">
          <button class="prof-seg-btn${saveAdv === 'disadv' ? ' active' : ''}" data-state="disadv"><i class="ti ti-chevrons-down"></i> Disadv.</button>
          <button class="prof-seg-btn${saveAdv === 'none'   ? ' active' : ''}" data-state="none">Normal</button>
          <button class="prof-seg-btn${saveAdv === 'adv'    ? ' active' : ''}" data-state="adv"><i class="ti ti-chevrons-up"></i> Adv.</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Override Bonus</label>
        <input class="form-input" id="save-override-input" type="number" value="${hasOver ? st.override : ''}" placeholder="Override (${autoStr})">
        <div class="tab-hint">Leave blank to auto-calculate from proficiency</div>
      </div>
      <div class="form-actions">
        <button class="btn-cancel" id="save-override-cancel">Cancel</button>
        <button class="btn-save" id="save-override-save">Save</button>
      </div>
    </div>`;

  document.getElementById('save-prof-seg').addEventListener('click', e => {
    const btn = e.target.closest('.prof-seg-btn');
    if (!btn) return;
    document.querySelectorAll('#save-prof-seg .prof-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
  document.getElementById('save-adv-seg').addEventListener('click', e => {
    const btn = e.target.closest('.prof-seg-btn');
    if (!btn) return;
    document.querySelectorAll('#save-adv-seg .prof-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  document.getElementById('save-override-cancel').addEventListener('click', () => closeOverlay('overlay'));
  document.getElementById('save-override-save').addEventListener('click', () => {
    if (!c) { closeOverlay('overlay'); return; }
    if (!c.savingThrows) c.savingThrows = blankSavingThrows();
    if (!c.savingThrows[ability]) c.savingThrows[ability] = { prof: false, override: null };
    const selectedProf = document.querySelector('#save-prof-seg .prof-seg-btn.active')?.dataset.state || 'none';
    c.savingThrows[ability].prof = selectedProf === 'prof';
    const selectedAdv = document.querySelector('#save-adv-seg .prof-seg-btn.active')?.dataset.state || 'none';
    c.savingThrows[ability].adv = selectedAdv;
    const raw = document.getElementById('save-override-input').value.trim();
    c.savingThrows[ability].override = raw === '' ? null : parseInt(raw);
    save();
    closeOverlay('overlay');
    renderDefenseTab();
  });

  openOverlay('overlay');
}

// ── OPEN CHARACTER DETAILS SHEET (Darkvision + Speeds) ─
function openCharacterDetailsSheet() {
  const c = currentChar();
  if (!c) return;
  const dv = c.darkvision != null ? c.darkvision : '';

  document.getElementById('sheetTitle').innerHTML = `<i class="ti ti-user c-gold"></i> Character Details`;
  document.getElementById('sheetBody').innerHTML = `
    <div class="edit-form">
      <div class="form-row">
        <label class="form-label"><i class="ti ti-eye c-blue"></i> Darkvision</label>
        <input class="form-input" id="cd-dv" type="number" min="0" value="${dv}" placeholder="e.g. 60">
        <div class="tab-hint">Range in feet. Leave blank for no darkvision.</div>
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-shoe c-blue"></i> Walk Speed</label>
        <input class="form-input" id="cd-walk" value="${c.speed || '30 ft'}">
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-feather c-blue"></i> Fly Speed</label>
        <input class="form-input" id="cd-fly" value="${c.flySpeed || ''}" placeholder="Leave blank if none">
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-mountain c-blue"></i> Climb Speed</label>
        <input class="form-input" id="cd-climb" value="${c.climbSpeed || ''}" placeholder="Default: half walk speed">
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-ripple c-blue"></i> Swim Speed</label>
        <input class="form-input" id="cd-swim" value="${c.swimSpeed || ''}" placeholder="Default: half walk speed">
      </div>
      <div class="form-actions">
        <button class="btn-cancel" id="cd-cancel">Cancel</button>
        <button class="btn-save" id="cd-save">Save</button>
      </div>
    </div>`;

  document.getElementById('cd-cancel').addEventListener('click', () => closeOverlay('overlay'));
  document.getElementById('cd-save').addEventListener('click', () => {
    const dvRaw  = document.getElementById('cd-dv').value.trim();
    c.darkvision = dvRaw === '' ? null : parseInt(dvRaw);
    c.speed      = document.getElementById('cd-walk').value.trim()  || c.speed;
    c.flySpeed   = document.getElementById('cd-fly').value.trim()   || null;
    c.climbSpeed = document.getElementById('cd-climb').value.trim() || null;
    c.swimSpeed  = document.getElementById('cd-swim').value.trim()  || null;
    save();
    closeOverlay('overlay');
    renderExploreTab();
  });
  openOverlay('overlay');
}

// ── OPEN PASSIVE SCORES SHEET ─────────────────────────────────
function openPassiveScoresSheet() {
  const c = currentChar();
  if (!c) return;
  const ovr = c.passiveOverrides || {};

  const autoPerc = 10 + calcSkillBonus(c, 'perception');
  const autoInv  = 10 + calcSkillBonus(c, 'investigation');
  const autoIns  = 10 + calcSkillBonus(c, 'insight');

  document.getElementById('sheetTitle').innerHTML = `<i class="ti ti-eye c-blue"></i> Passive Scores`;
  document.getElementById('sheetBody').innerHTML = `
    <div class="edit-form">
      <div class="tab-hint" style="margin-bottom:4px;">Leave blank to use the auto-calculated value (10 + skill bonus).</div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-eye c-blue"></i> Perception</label>
        <input class="form-input" id="ps-perc" type="number" value="${ovr.perception != null ? ovr.perception : ''}" placeholder="Override (${autoPerc})">
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-zoom-question c-green"></i> Investigation</label>
        <input class="form-input" id="ps-inv" type="number" value="${ovr.investigation != null ? ovr.investigation : ''}" placeholder="Override (${autoInv})">
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-bulb c-amber"></i> Insight</label>
        <input class="form-input" id="ps-ins" type="number" value="${ovr.insight != null ? ovr.insight : ''}" placeholder="Override (${autoIns})">
      </div>
      <div class="form-actions">
        <button class="btn-cancel" id="ps-cancel">Cancel</button>
        <button class="btn-save" id="ps-save">Save</button>
      </div>
    </div>`;

  document.getElementById('ps-cancel').addEventListener('click', () => closeOverlay('overlay'));
  document.getElementById('ps-save').addEventListener('click', () => {
    if (!c.passiveOverrides) c.passiveOverrides = {};
    const rawPerc = document.getElementById('ps-perc').value.trim();
    const rawInv  = document.getElementById('ps-inv').value.trim();
    const rawIns  = document.getElementById('ps-ins').value.trim();
    c.passiveOverrides.perception    = rawPerc === '' ? null : parseInt(rawPerc);
    c.passiveOverrides.investigation = rawInv  === '' ? null : parseInt(rawInv);
    c.passiveOverrides.insight       = rawIns  === '' ? null : parseInt(rawIns);
    save();
    closeOverlay('overlay');
    renderExploreTab();
  });
  openOverlay('overlay');
}

// ── OPEN SKILL OVERRIDE SHEET ────────────────────────────────
function openSkillOverrideSheet(skillKey) {
  const skill = SKILLS.find(s => s.key === skillKey);
  if (!skill) return;
  const c            = currentChar();
  const state        = (c && c.skills && c.skills[skillKey]) || 'none';
  const score        = c ? (c[skill.ability] || 10) : 10;
  const mod          = getAbilityMod(score);
  const profNum      = parseInt((c && c.prof) || '+2') || 2;
  let autoVal = mod;
  if (state === 'prof')   autoVal = mod + profNum;
  if (state === 'expert') autoVal = mod + profNum * 2;
  const autoStr      = (autoVal >= 0 ? '+' : '') + autoVal;
  const overrides    = (c && c.skillOverrides) || {};
  const hasOver      = overrides[skillKey] !== null && overrides[skillKey] !== undefined;
  const skillAdv     = ((c && c.skillAdv) || {})[skillKey] || 'none';

  document.getElementById('sheetTitle').innerHTML =
    `${abilityIcon(skill.ability)} ${skill.name} <span style="font-weight:400;color:var(--ink-faint);font-size:0.8em;">(${skill.ability.toUpperCase()})</span>`;
  document.getElementById('sheetBody').innerHTML = `
    <div class="edit-form">
      <div class="form-row">
        <label class="form-label">Proficiency</label>
        <div class="prof-seg" id="prof-seg">
          <button class="prof-seg-btn${state === 'none'   ? ' active' : ''}" data-state="none">None</button>
          <button class="prof-seg-btn${state === 'prof'   ? ' active' : ''}" data-state="prof"><i class="ti ti-circle-filled"></i> Proficient</button>
          <button class="prof-seg-btn${state === 'expert' ? ' active' : ''}" data-state="expert"><i class="ti ti-star-filled"></i> Expertise</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Advantage</label>
        <div class="prof-seg" id="skill-adv-seg">
          <button class="prof-seg-btn${skillAdv === 'disadv' ? ' active' : ''}" data-state="disadv"><i class="ti ti-chevrons-down"></i> Disadv.</button>
          <button class="prof-seg-btn${skillAdv === 'none'   ? ' active' : ''}" data-state="none">Normal</button>
          <button class="prof-seg-btn${skillAdv === 'adv'    ? ' active' : ''}" data-state="adv"><i class="ti ti-chevrons-up"></i> Adv.</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Override Bonus</label>
        <input class="form-input" id="skill-override-input" type="number" value="${hasOver ? overrides[skillKey] : ''}" placeholder="Override (${autoStr})">
        <div class="tab-hint">Leave blank to auto-calculate from proficiency</div>
      </div>
      <div class="form-actions">
        <button class="btn-cancel" id="skill-override-cancel">Cancel</button>
        <button class="btn-save"   id="skill-override-save">Save</button>
      </div>
    </div>`;

  document.getElementById('prof-seg').addEventListener('click', e => {
    const btn = e.target.closest('.prof-seg-btn');
    if (!btn) return;
    document.querySelectorAll('#prof-seg .prof-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
  document.getElementById('skill-adv-seg').addEventListener('click', e => {
    const btn = e.target.closest('.prof-seg-btn');
    if (!btn) return;
    document.querySelectorAll('#skill-adv-seg .prof-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  document.getElementById('skill-override-cancel').addEventListener('click', () => closeOverlay('overlay'));
  document.getElementById('skill-override-save').addEventListener('click', () => {
    if (!c) { closeOverlay('overlay'); return; }
    const selectedState = document.querySelector('#prof-seg .prof-seg-btn.active')?.dataset.state || 'none';
    if (!c.skills) c.skills = {};
    c.skills[skillKey] = selectedState;
    if (!c.skillOverrides) c.skillOverrides = {};
    const raw = document.getElementById('skill-override-input').value.trim();
    c.skillOverrides[skillKey] = raw === '' ? null : parseInt(raw);
    if (!c.skillAdv) c.skillAdv = {};
    c.skillAdv[skillKey] = document.querySelector('#skill-adv-seg .prof-seg-btn.active')?.dataset.state || 'none';
    save();
    closeOverlay('overlay');
    renderExploreTab();
  });

  openOverlay('overlay');
}

// ── OPEN ADD / EDIT RESISTANCE / IMMUNITY SHEET ───────────────
function openAddResistanceSheet(type, editIndex = null) {
  const label    = type === 'resistances' ? 'Resistance' : 'Immunity';
  const isEdit   = editIndex !== null;
  const c        = currentChar();
  const existing = isEdit ? (c && c[type] && c[type][editIndex]) || '' : '';

  document.getElementById('sheetTitle').innerHTML =
    `<i class="ti ti-${isEdit ? 'pencil' : 'plus'} c-blue"></i> ${isEdit ? 'Edit' : 'Add'} ${label}`;
  document.getElementById('sheetBody').innerHTML = `
    <div class="edit-form">
      <div class="form-row">
        <label class="form-label">${label} Type</label>
        <input class="form-input" id="resist-input" placeholder="e.g. Fire damage" autocomplete="off" value="${existing}">
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn-delete" id="resist-delete"><i class="ti ti-trash"></i></button>` : ''}
        <button class="btn-cancel" id="resist-cancel">Cancel</button>
        <button class="btn-save" id="resist-save">${isEdit ? 'Save' : 'Add'}</button>
      </div>
    </div>`;

  document.getElementById('resist-cancel').addEventListener('click', () => closeOverlay('overlay'));
  if (isEdit) {
    document.getElementById('resist-delete').addEventListener('click', () => {
      const c = currentChar();
      if (!c || !c[type]) return;
      c[type].splice(editIndex, 1);
      save();
      closeOverlay('overlay');
      renderDefenseTab();
    });
  }
  document.getElementById('resist-save').addEventListener('click', () => {
    const val = document.getElementById('resist-input').value.trim();
    if (!val) { document.getElementById('resist-input').focus(); return; }
    const c = currentChar();
    if (!c) return;
    if (!c[type]) c[type] = [];
    if (isEdit) {
      c[type][editIndex] = val;
    } else {
      c[type].push(val);
    }
    save();
    closeOverlay('overlay');
    renderDefenseTab();
  });

  openOverlay('overlay');
}

// ── OPEN ADD SHEET ────────────────────────────────────────────
function openAddSheet(key, category) {
  resetSheetPin();
  const cfg = CATEGORIES[category];
  const typeLabel = key.endsWith('_bonus') ? ' Bonus Action' : key.endsWith('_action') ? ' Action' : '';
  const addTitle  = category === 'magic' ? `${cfg.label}${typeLabel}` : cfg.label;
  document.getElementById('sheetTitle').innerHTML =
    `<i class="ti ti-plus ${cfg.color}"></i> Add ${addTitle}`;
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
  if (key.endsWith('_action') || key.endsWith('_bonus')) showSheetPin(ability, key);
  else resetSheetPin();
  openOverlay('overlay');
}

// ── BUILD ABILITY FORM ────────────────────────────────────────
function buildForm(ability, key) {
  const category = key.split('_')[0];
  const v = f => ability ? (ability[f] || '') : '';
  const badges = category === 'attack'
    ? [
        { value: 'melee',  label: 'Melee' },
        { value: 'ranged', label: 'Ranged' },
        { value: 'thrown', label: 'Thrown' },
      ]
    : category === 'magic'
    ? [
        { value: 'spell',        label: 'Spell' },
        { value: 'spell-attack', label: 'Spell Attack' },
        { value: 'buff',         label: 'Buff' },
        { value: 'ability',      label: 'Ability' },
      ]
    : category === 'features'
    ? [
        { value: 'feat',    label: 'Feat' },
        { value: 'origin',  label: 'Origin' },
        { value: 'species', label: 'Species' },
      ]
    : [
        { value: 'action',  label: 'Action' },
        { value: 'bonus',   label: 'Bonus' },
        { value: 'passive', label: 'Passive' },
      ];

  let extraFields = '';
  if (category === 'attack') {
    extraFields = `
      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label">To Hit</label>
          <input class="form-input" id="f-toHit" value="${normalizeBonus(v('toHit'))}" placeholder="+8">
        </div>
        <div class="form-row">
          <label class="form-label">Range</label>
          <input class="form-input" id="f-range" value="${v('range')}" placeholder="5 ft.">
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Damage</label>
        <input class="form-input" id="f-damage" value="${v('damage')}" placeholder="2d6+4 slashing">
      </div>`;
  } else if (category === 'magic') {
    const SPELL_LEVELS = ['Cantrip','1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];
    const curLevel = v('spellLevel') || 'Cantrip';
    const isConc   = ability ? !!ability.concentration : false;
    extraFields = `
      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label">Spell Level</label>
          <select class="form-select" id="f-spellLevel">
            ${SPELL_LEVELS.map(l => `<option value="${l}"${curLevel === l ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">Range / Area</label>
          <input class="form-input" id="f-range" value="${v('range')}" placeholder="60 ft.">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label">Attack / Save</label>
          <input class="form-input" id="f-saveOrAttack" value="${v('saveOrAttack')}" placeholder="DEX Save DC 15">
        </div>
        <div class="form-row">
          <label class="form-label">Damage / Effect</label>
          <input class="form-input" id="f-damage" value="${v('damage')}" placeholder="3d6 fire">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label">Duration</label>
          <input class="form-input" id="f-duration" value="${v('duration')}" placeholder="e.g. 1 minute">
        </div>
        <div class="form-row">
          <label class="form-label">Concentration</label>
          <div class="prof-seg" id="f-conc-seg">
            <button class="prof-seg-btn${!isConc ? ' active' : ''}" data-state="no">No</button>
            <button class="prof-seg-btn${isConc  ? ' active' : ''}" data-state="yes">Yes</button>
          </div>
        </div>
      </div>`;
  } else if (category !== 'reaction') {
    extraFields = `
      <div class="form-row">
        <label class="form-label">Stats / Damage (optional)</label>
        <input class="form-input" id="f-stat" value="${v('stat')}" placeholder="e.g. 1d6+8 slashing · +8 to hit">
      </div>`;
  }

  const namePlaceholder = category === 'magic'  ? 'e.g. Magic Missile'
    : category === 'attack' ? 'e.g. Handaxe Throw'
    : category === 'items'  ? 'e.g. Healing Potion'
    : 'e.g. Action Surge';

  return `
    <div class="edit-form">
      <div class="form-row">
        <label class="form-label">Name</label>
        <input class="form-input" id="f-name" value="${v('name')}" placeholder="${namePlaceholder}">
      </div>
      ${category !== 'reaction' ? `
      <div class="form-row">
        <label class="form-label">${category === 'attack' ? 'Weapon Type' : 'Type'}</label>
        <select class="form-select" id="f-badge">
          ${badges.map(b => `<option value="${b.value}" ${v('badge') === b.value ? 'selected' : ''}>${b.label}</option>`).join('')}
        </select>
      </div>` : ''}
      ${extraFields}
      <div class="form-row">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="f-desc" placeholder="What does this ability do?">${v('desc')}</textarea>
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
  const category = key.split('_')[0];

  document.getElementById('f-cancel').addEventListener('click', () => closeOverlay('overlay'));

  const concSeg = document.getElementById('f-conc-seg');
  if (concSeg) {
    concSeg.addEventListener('click', e => {
      const btn = e.target.closest('.prof-seg-btn');
      if (!btn) return;
      concSeg.querySelectorAll('.prof-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  document.getElementById('f-save').addEventListener('click', () => {
    const name = document.getElementById('f-name').value.trim();
    if (!name) { document.getElementById('f-name').focus(); return; }

    const badgeEl = document.getElementById('f-badge');
    const entry = {
      id:     ability ? ability.id : 'ab_' + Date.now(),
      name,
      badge:  badgeEl ? badgeEl.value : 'reaction',
      desc:   document.getElementById('f-desc').value.trim(),
      pinned: ability ? (ability.pinned || false) : false,
    };

    if (category === 'attack') {
      entry.toHit  = normalizeBonus(document.getElementById('f-toHit').value.trim());
      entry.damage = document.getElementById('f-damage').value.trim();
      entry.range  = document.getElementById('f-range').value.trim();
    } else if (category === 'magic') {
      entry.spellLevel    = document.getElementById('f-spellLevel').value.trim();
      entry.range         = document.getElementById('f-range').value.trim();
      entry.saveOrAttack  = document.getElementById('f-saveOrAttack').value.trim();
      entry.damage        = document.getElementById('f-damage').value.trim();
      entry.duration      = document.getElementById('f-duration').value.trim();
      entry.concentration = document.querySelector('#f-conc-seg .prof-seg-btn.active')?.dataset.state === 'yes';
    } else {
      const statEl = document.getElementById('f-stat');
      if (statEl) entry.stat = statEl.value.trim();
    }

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

// Tap the dark backdrop (outside the sheet) to dismiss
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
      <div class="form-row-3">
        <div class="form-row">
          <label class="form-label"><i class="ti ti-crown"></i> Level</label>
          <input class="form-input" id="s-level" type="number" min="1" max="20" value="${c.level || ''}">
        </div>
        <div class="form-row">
          <label class="form-label"><i class="ti ti-dna"></i> Species</label>
          <input class="form-input" id="s-species" value="${c.species || ''}" placeholder="e.g. Human">
        </div>
        <div class="form-row">
          <label class="form-label"><i class="ti ti-wand"></i> Class</label>
          <input class="form-input" id="s-cls" value="${c.cls || ''}">
        </div>
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
          <label class="form-label"><i class="ti ti-star"></i> Prof. Bonus</label>
          <input class="stat-edit-input" id="s-prof" value="${c.prof || '+2'}">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-row">
          <label class="form-label"><i class="ti ti-swords"></i> Attacks / Round</label>
          <input class="stat-edit-input" id="s-attacks" type="number" min="1" max="10" value="${c.attacksPerRound || 1}">
        </div>
        <div></div>
      </div>
      <div class="form-row">
        <label class="form-label"><i class="ti ti-ruler-2"></i> Size</label>
        <div class="prof-seg" id="size-seg">
          <button class="prof-seg-btn${(c.size||'medium')==='small'  ? ' active' : ''}" data-state="small">Small</button>
          <button class="prof-seg-btn${(c.size||'medium')==='medium' ? ' active' : ''}" data-state="medium">Medium</button>
          <button class="prof-seg-btn${(c.size||'medium')==='large'  ? ' active' : ''}" data-state="large">Large</button>
        </div>
      </div>
      <div class="section-lbl">Ability Scores</div>
      <div class="form-row-3">
        <div class="form-row">
          <label class="form-label">STR</label>
          <input class="stat-edit-input" id="s-str" type="number" min="1" max="30" value="${c.str || 10}">
          <div class="ability-mod" id="s-str-mod">${modStr(c.str || 10)}</div>
        </div>
        <div class="form-row">
          <label class="form-label">DEX</label>
          <input class="stat-edit-input" id="s-dex" type="number" min="1" max="30" value="${c.dex || 10}">
          <div class="ability-mod" id="s-dex-mod">${modStr(c.dex || 10)}</div>
        </div>
        <div class="form-row">
          <label class="form-label">CON</label>
          <input class="stat-edit-input" id="s-con" type="number" min="1" max="30" value="${c.con || 10}">
          <div class="ability-mod" id="s-con-mod">${modStr(c.con || 10)}</div>
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-row">
          <label class="form-label">INT</label>
          <input class="stat-edit-input" id="s-int" type="number" min="1" max="30" value="${c.int || 10}">
          <div class="ability-mod" id="s-int-mod">${modStr(c.int || 10)}</div>
        </div>
        <div class="form-row">
          <label class="form-label">WIS</label>
          <input class="stat-edit-input" id="s-wis" type="number" min="1" max="30" value="${c.wis || 10}">
          <div class="ability-mod" id="s-wis-mod">${modStr(c.wis || 10)}</div>
        </div>
        <div class="form-row">
          <label class="form-label">CHA</label>
          <input class="stat-edit-input" id="s-cha" type="number" min="1" max="30" value="${c.cha || 10}">
          <div class="ability-mod" id="s-cha-mod">${modStr(c.cha || 10)}</div>
        </div>
      </div>
      <div class="section-lbl"><i class="ti ti-wand c-purple"></i> Spell Slots</div>
      <div class="tab-hint" style="margin-bottom:10px;">Max slots per level. Leave at 0 if not a caster.</div>
      <div class="slot-config-grid">
        ${SLOT_ORDINALS.map((ord, i) => {
          const lvl = i + 1;
          const max = (c.spellSlots && c.spellSlots[lvl]) ? c.spellSlots[lvl].max : 0;
          return `<div class="slot-config-cell">
            <label class="form-label">${ord}</label>
            <input class="stat-edit-input" id="s-slot-${lvl}" type="number" min="0" max="9" value="${max}">
          </div>`;
        }).join('')}
      </div>
      <div class="form-actions" style="margin-top:4px;">
        <button class="btn-cancel" id="s-cancel">Cancel</button>
        <button class="btn-save"   id="s-save">Save</button>
      </div>
    </div>`;

  document.getElementById('s-cancel').addEventListener('click', () => closeOverlay('statOverlay'));
  document.getElementById('s-save').addEventListener('click', () => {
    c.name    = document.getElementById('s-name').value.trim()  || c.name;
    c.level   = document.getElementById('s-level').value.trim();
    c.species = document.getElementById('s-species').value.trim();
    c.cls     = document.getElementById('s-cls').value.trim();
    const subParts = [
      c.level ? `Lvl ${c.level}` : null,
      c.species || null,
      c.cls || null,
    ].filter(Boolean);
    if (subParts.length) c.sub = subParts.join(' · ');
    c.hp    = parseInt(document.getElementById('s-hp').value)  || c.hp;
    c.ac    = parseInt(document.getElementById('s-ac').value)  || c.ac;
    c.speed = document.getElementById('s-speed').value.trim() || c.speed;
    c.prof  = document.getElementById('s-prof').value.trim()  || c.prof;
    c.str   = parseInt(document.getElementById('s-str').value) || c.str || 10;
    c.dex   = parseInt(document.getElementById('s-dex').value) || c.dex || 10;
    c.con   = parseInt(document.getElementById('s-con').value) || c.con || 10;
    c.int   = parseInt(document.getElementById('s-int').value) || c.int || 10;
    c.wis   = parseInt(document.getElementById('s-wis').value) || c.wis || 10;
    c.cha   = parseInt(document.getElementById('s-cha').value) || c.cha || 10;
    c.size          = document.querySelector('#size-seg .prof-seg-btn.active')?.dataset.state || c.size || 'medium';
    c.attacksPerRound = parseInt(document.getElementById('s-attacks').value) || 1;
    if (!c.spellSlots) c.spellSlots = blankSpellSlots();
    for (let lvl = 1; lvl <= 9; lvl++) {
      const input = document.getElementById(`s-slot-${lvl}`);
      if (input) {
        const newMax = parseInt(input.value) || 0;
        const oldUsed = (c.spellSlots[lvl] || {}).used || 0;
        c.spellSlots[lvl] = { max: newMax, used: Math.min(oldUsed, newMax) };
      }
    }
    save();
    renderHeader();
    renderAllSimpleTabs();
    closeOverlay('statOverlay');
  });

  document.getElementById('size-seg').addEventListener('click', e => {
    const btn = e.target.closest('.prof-seg-btn');
    if (!btn) return;
    document.querySelectorAll('#size-seg .prof-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
    const input = document.getElementById(`s-${ab}`);
    const mod   = document.getElementById(`s-${ab}-mod`);
    if (input && mod) {
      input.addEventListener('input', () => {
        mod.textContent = modStr(parseInt(input.value) || 10);
      });
    }
  });

  openOverlay('statOverlay');
}

document.getElementById('statClose').addEventListener('click', () => closeOverlay('statOverlay'));

// ── HERO SUMMARY ─────────────────────────────────────────────
function openHeroSummary() {
  const c = currentChar();
  if (!c) return;

  const subParts = [
    c.level   ? `Lvl ${c.level}` : null,
    c.species || null,
    c.cls     || null,
  ].filter(Boolean);
  const sub = subParts.join(' · ') || c.sub || '';

  const avatarInner = c.avatar
    ? `<img src="${c.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : `<i class="ti ti-user" style="font-size:32px;color:var(--gold);"></i>`;

  const ABILITY_LABELS = { str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA' };
  const abilityGrid = ['str','dex','con','int','wis','cha'].map(ab => `
    <div class="hero-ability">
      <div class="hero-ability-label">${ABILITY_LABELS[ab]}</div>
      <div class="hero-ability-score">${c[ab] || 10}</div>
      <div class="hero-ability-mod">${modStr(c[ab] || 10)}</div>
    </div>`).join('');

  document.getElementById('heroBody').innerHTML = `
    <div class="hero-summary">
      <div class="hero-top">
        <div class="hero-avatar-wrap" id="heroAvatarWrap">
          <div class="hero-avatar">${avatarInner}</div>
          <div class="hero-avatar-edit"><i class="ti ti-camera"></i></div>
          <input type="file" id="heroAvatarInput" accept="image/*" style="display:none;">
        </div>
        <div class="hero-ident">
          <div class="hero-name">${c.name}</div>
          ${sub ? `<div class="hero-sub">${sub}</div>` : ''}
        </div>
      </div>
      <div class="hero-pills">
        <div class="hero-pill"><i class="ti ti-heart c-red"></i><span>${c.hp || '—'}</span><div class="hero-pill-lbl">Max HP</div></div>
        <div class="hero-pill"><i class="ti ti-shield ac-i"></i><span>${c.ac || '—'}</span><div class="hero-pill-lbl">AC</div></div>
        <div class="hero-pill"><i class="ti ti-shoe speed-i"></i><span>${c.speed || '30ft'}</span><div class="hero-pill-lbl">Speed</div></div>
        <div class="hero-pill"><i class="ti ti-star prof-i"></i><span>${c.prof || '+2'}</span><div class="hero-pill-lbl">Prof</div></div>
      </div>
      <div class="hero-ability-grid">${abilityGrid}</div>
      <div class="hero-actions">
        <button class="btn-cancel" id="heroSwitchBtn"><i class="ti ti-users"></i> Switch</button>
        <button class="btn-save"   id="heroEditBtn"><i class="ti ti-pencil"></i> Edit Stats</button>
      </div>
    </div>`;

  document.getElementById('heroAvatarWrap').addEventListener('click', () => {
    document.getElementById('heroAvatarInput').click();
  });

  document.getElementById('heroAvatarInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      c.avatar = ev.target.result;
      save();
      renderHeader();
      const heroAvatar = document.querySelector('#heroBody .hero-avatar');
      if (heroAvatar) heroAvatar.innerHTML =
        `<img src="${c.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('heroEditBtn').addEventListener('click', () => {
    closeOverlay('heroOverlay');
    openStatSheet();
  });

  document.getElementById('heroSwitchBtn').addEventListener('click', () => {
    closeOverlay('heroOverlay');
    renderCharSwitcher();
    openOverlay('charOverlay');
  });

  openOverlay('heroOverlay');
}

// ── CHARACTER SWITCHER ────────────────────────────────────────
function renderCharSwitcher() {
  const body = document.getElementById('charBody');

  body.innerHTML = characters.map(c => `
    <div class="char-list-item" data-id="${c.id}">
      <div class="char-list-avatar">${c.avatar
        ? `<img src="${c.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<i class="ti ti-user"></i>`}</div>
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
        showWelcome(true);
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

document.getElementById('heroClose').addEventListener('click', () => closeOverlay('heroOverlay'));
document.getElementById('charClose').addEventListener('click', () => closeOverlay('charOverlay'));
document.getElementById('header').addEventListener('click', openHeroSummary);

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

setTimeout(hideLoading, 1200);

// ── WELCOME DIE INTERACTION ───────────────────────────────────
(function () {
  const die = document.querySelector('.welcome-icon');
  if (!die) return;

  function spin() {
    die.classList.remove('spinning');
    void die.offsetWidth; // force reflow to restart animation
    die.classList.add('spinning');
  }

  die.addEventListener('animationend', () => die.classList.remove('spinning'));
  die.addEventListener('click', () => { if (!die.classList.contains('spinning')) spin(); });

  spin(); // play once on load
}());

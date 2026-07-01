import {
  addHabit, updateHabit, deleteHabit, toggleHabit,
  esc, uid, haptic, today, weekDates,
} from './habits.js'
import { getAllStreaks, saveMood, saveJournal, setEnergy } from './streaks.js'
import {
  getStats, todayPct, getWeeklyChartData,
  getHabitConsistency, getWeeklyInsight,
  getMoodData, getEnergyData, getLeakData, getRealityData, getRCInsight,
} from './stats.js'
import { getThemes, changeTheme, toggleDarkMode, getDarkMode, resetHabits, saveProfile, doExport, doImport } from './settings.js'
import { saveState } from './storage.js'

const QUOTES = [
  'Small steps every day 🌱', 'Progress, not perfection ✨',
  'Every streak starts with day one 🔥', 'Your future self is cheering for you 🎉',
  'Tiny habits, massive results 💥', 'Be patient with yourself 🌸',
  'Rest is part of the process too 🌙', 'Consistency is a superpower ⚡',
  "You're doing better than you think 💫", 'One day at a time 🌿',
]

const MOODS = [{ e: '😞', l: 'Bad', v: 1 }, { e: '😐', l: 'Meh', v: 2 }, { e: '🙂', l: 'Good', v: 3 }, { e: '😊', l: 'Great', v: 4 }, { e: '🤩', l: 'Amazing', v: 5 }]
const ENERGY_SUGGEST = {
  1: { label: 'Low Energy', icon: '🪫', color: '#f8c8c8', textColor: '#c84040', tasks: ['Light reading', 'Revision', 'Organize notes', 'Skincare routine', 'Gentle walk'], tip: 'Keep it light. Review old material, rest.' },
  2: { label: 'Medium Energy', icon: '⚡', color: '#f8e8b8', textColor: '#c87820', tasks: ['Complete homework', 'Workout', 'Study familiar topics', 'Plan tomorrow', 'Read new chapter'], tip: 'Solid focus. Tackle normal tasks.' },
  3: { label: 'High Energy', icon: '🚀', color: '#c8f8e0', textColor: '#2a9060', tasks: ['Deep study session', 'Hard problems', 'New concepts', 'Workout hard', 'Create/build something'], tip: 'Use this peak! Attack the hardest tasks first.' },
}
const BADGES = [
  { id: 'b1', i: '🌟', n: 'First Step', d: 'Complete first habit', q: (s) => s.total >= 1 },
  { id: 'b2', i: '🔥', n: 'On Fire', d: '7-day streak', q: (s) => s.maxStreak >= 7 },
  { id: 'b3', i: '💎', n: 'Consistent', d: '50 total completions', q: (s) => s.total >= 50 },
  { id: 'b4', i: '👑', n: 'Champion', d: '30-day streak', q: (s) => s.maxStreak >= 30 },
  { id: 'b5', i: '🌈', n: 'Mood Logger', d: 'Log mood 5 days', q: (s) => s.moodDays >= 5 },
  { id: 'b6', i: '🎯', n: 'Century', d: '100 completions', q: (s) => s.total >= 100 },
]
const ICONS = ['⭐', '📚', '🏃', '✨', '📖', '💛', '🌙', '🎵', '🧘', '💧', '🎨', '🧠', '💊', '🛁', '🌿', '🎮', '🍎', '🏋️', '🧩', '📝']
const AVATARS = ['🌸', '🌙', '⭐', '🦋', '🌿', '🐾', '🎯', '🦊', '🐼', '🌊', '🧠', '🎮']
const LEAK_PRESETS = [
  { l: 'Scrolling', i: '📱' }, { l: 'YouTube', i: '▶️' }, { l: 'Daydreaming', i: '💭' },
  { l: 'Overthinking', i: '🌀' }, { l: 'Gaming', i: '🎮' }, { l: 'Chatting', i: '💬' },
  { l: 'Procrastinating', i: '🐌' }, { l: 'Other', i: '🕳️' },
]
const PRIO_COLS = { High: ['#f8c8c8', '#c84040'], Medium: ['#f8e8b8', '#c87820'], Low: ['#c8f8e0', '#2a9060'] }

let _S = null
let currentTab = 'home'
let focusTimer = null
let pomTimer = null
let _catState = 'neutral'
let _catVisible = true
let _catBubbleTimer = null
let _catHappyTimer = null
let _reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const CAT_STATES = {
  happy: { img: 'happy', cls: 'state-happy', bubbles: ['You did it! 🎉', 'Yes!! 🥳', 'Purrfect! ✨', 'Amazing!! 🌟'] },
  focus: { img: 'reading', cls: 'state-focus', bubbles: ['Stay focused 📖', 'You got this 💪', 'Deep work mode 🎯', 'No distractions!'] },
  idle: { img: 'sleeping', cls: 'state-idle', bubbles: ['Zzz... 💤', 'Rest time 🌙', 'Taking a nap 😴', 'Sweet dreams~'] },
  neutral: { img: 'neutral', cls: 'state-neutral', bubbles: ['Hi there! 👋', 'Ready to go? ⚡', "Let's do this! 🌸", 'Meow~ 🐱'] },
}

/* ── UI State ── */
const UI = { _state: {}, reset() { this._state = {} }, set(k, v) { this._state[k] = v }, get(k, fb) { return this._state[k] !== undefined ? this._state[k] : fb } }

export function init(S) {
  _S = S
}

export function render(html) {
  document.getElementById('page').innerHTML = html
}

export function showModal(title, content) {
  closeModal()
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">${esc(title)}</span>
        <button class="modal-close" onclick="document.getElementById('modal-overlay')?.remove()">✕</button>
      </div>
      ${content}
    </div>`
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal() })
  document.body.appendChild(overlay)
}

export function closeModal() {
  const el = document.getElementById('modal-overlay')
  if (el) el.remove()
  UI.reset()
}

export function showToast(message, bgColor = 'var(--pl)', textColor = 'var(--pa)') {
  const toast = document.createElement('div')
  toast.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:700;
    background:${bgColor};color:${textColor};border-radius:14px;padding:12px 20px;
    font-size:13px;font-weight:800;box-shadow:0 4px 20px rgba(0,0,0,.15);
    max-width:320px;text-align:center;animation:slideUp .3s ease;`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3500)
}

/* ── Progress Ring ── */
function progressRingHTML(pct, size, stroke, idPrefix) { // eslint-disable-line no-unused-vars
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const off = circ * (1 - pct / 100)
  return `
    <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pl)" stroke-width="${stroke}"/>
      <circle id="${idPrefix}-ring-circle" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
        stroke="var(--pd)" stroke-width="${stroke}"
        stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        stroke-linecap="round" style="transition:stroke-dashoffset .6s ease"/>
    </svg>`
}

/* ── Avatar Grid ── */
function renderAvatarGrid(containerId, stateKey, currentAvatar) {
  return AVATARS.map((avatar) => `
    <button onclick="window.selectInGrid('${containerId}','${stateKey}','${avatar}')"
      id="${containerId}-${avatar}"
      style="font-size:22px;width:40px;height:40px;border-radius:10px;transition:all .2s;
      background:${currentAvatar === avatar ? 'var(--p)' : 'var(--pl)'};
      border:2px solid ${currentAvatar === avatar ? 'var(--pd)' : 'transparent'}">
      ${avatar}
    </button>`).join('')
}

/* ── Toggle Habit (targeted DOM patch) ── */
export function toggleHabitUI(habitId) {
  const isDone = toggleHabit(habitId)
  haptic(isDone ? 'success' : 'light')

  const card = document.querySelector(`[data-habit-id="${habitId}"]`)
  const toggle = card?.querySelector('.habit-toggle')
  const nameEl = card?.querySelector('.habit-name')
  if (card && toggle) {
    card.classList.toggle('done', isDone)
    toggle.classList.toggle('done', isDone)
    toggle.innerHTML = isDone
      ? '<span style="font-size:18px">✓</span>'
      : `<span style="font-size:20px">${esc(_S.habits.find((h) => h.id === habitId)?.icon || '')}</span>`
    if (nameEl) nameEl.classList.toggle('done', isDone)
    const badge = card.querySelector('.habit-done-badge')
    if (badge) badge.style.display = isDone ? '' : 'none'
    if (isDone) {
      card.classList.add('just-done')
      setTimeout(() => card.classList.remove('just-done'), 400)
    }
    const countEl = document.getElementById('habits-count')
    if (countEl) {
      const doneNow = _S.habits.filter((h) => _S.logs[today()]?.[h.id]?.done).length
      countEl.textContent = `${doneNow}/${_S.habits.length} done`
    }
    const pct = todayPct()
    const ringCircle = document.getElementById('home-ring-circle')
    const ringLabel = document.getElementById('home-ring-label')
    if (ringCircle) {
      const size = 72, stroke = 6, r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r
      ringCircle.setAttribute('stroke-dashoffset', (circ * (1 - pct / 100)).toFixed(1))
    }
    if (ringLabel) ringLabel.textContent = pct + '%'
  } else {
    pageHome()
  }
  catSetState('happy', true)
  clearTimeout(_catHappyTimer)
  _catHappyTimer = setTimeout(() => catSetState('neutral', false), 3500)
}

/* ── PAGE: Home ── */
export function pageHome() {
  const td = today()
  const todayLog = _S.logs[td] || {}
  const todayMood = _S.moods[td]
  const todayNote = _S.journal[td] || ''
  const energyLvl = _S.energy[td] || 0
  const auditDone = !!_S.audits[td]
  const leakMins = (_S.leaks[td] || []).reduce((sum, lk) => sum + lk.mins, 0)
  const pct = todayPct()
  const doneCount = _S.habits.filter((h) => todayLog[h.id]?.done).length
  const streaks = getAllStreaks()
  const quote = QUOTES[new Date().getDate() % QUOTES.length]
  const firstName = esc(_S.profile?.name?.split(' ')[0] || 'Friend')
  const avatar = esc(_S.profile?.avatar || '🌸')
  const dateStr = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  const ES = energyLvl ? ENERGY_SUGGEST[energyLvl] : null
  const rcInsight = getRCInsight()
  const size = 72, stroke = 6, r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r, off = circ * (1 - pct / 100)

  render(`
  <div class="pg-head fade-up">
    <div>
      <p style="font-size:var(--text-xs);color:var(--muted);font-weight:600">${dateStr}</p>
      <h2 style="font-size:var(--text-xl);font-weight:900;margin-top:2px">Hey, ${firstName} ${avatar}</h2>
    </div>
    <div class="ring-wrap" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pl)" stroke-width="${stroke}"/>
        <circle id="home-ring-circle" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pd)"
          stroke-width="${stroke}" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
          stroke-linecap="round" style="transition:stroke-dashoffset .6s ease"/>
      </svg>
      <div style="position:absolute;text-align:center">
        <div id="home-ring-label" style="font-size:13px;font-weight:900;color:var(--pa);line-height:1">${pct}%</div>
        <div style="font-size:9px;color:var(--muted);font-weight:700;margin-top:1px">today</div>
      </div>
    </div>
  </div>

  <button onclick="window.openEnergyPicker()" class="fade-up" style="width:100%;padding:12px 16px;border-radius:var(--r-md);
    margin-bottom:12px;background:${ES ? ES.color : '#fff'};border:1.5px solid ${ES ? ES.textColor : 'var(--p)'};
    display:flex;align-items:center;gap:10px;text-align:left;transition:all var(--t-base);box-shadow:var(--sh-1)">
    <span style="font-size:22px">${ES ? ES.icon : '⚡'}</span>
    <div style="flex:1">
      <p style="font-weight:800;font-size:var(--text-sm);color:${ES ? ES.textColor : 'var(--text)'}">
        ${ES ? esc(ES.label) + ' Day' : "Set Today's Energy Level"}
      </p>
      <p style="font-size:var(--text-xs);color:${ES ? ES.textColor : 'var(--muted)'};font-weight:600;opacity:.8">
        ${ES ? esc(ES.tip) : 'Tap to set — get smart task suggestions'}
      </p>
    </div>
    <span style="font-size:16px;color:${ES ? ES.textColor : 'var(--muted)'}">›</span>
  </button>

  ${ES ? `
  <div class="card fade-up" style="background:${ES.color}30;border-color:${ES.textColor}50;padding:14px 16px;margin-bottom:12px">
    <p style="font-size:var(--text-xs);font-weight:800;color:${ES.textColor};margin-bottom:8px">💡 Suggested Tasks</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${ES.tasks.slice(0, 4).map((t) => `
        <span style="padding:4px 11px;border-radius:99px;font-size:var(--text-xs);font-weight:800;
          background:${ES.color};color:${ES.textColor}">${esc(t)}</span>`).join('')}
    </div>
  </div>` : ''}

  <div class="quote-card fade-up">
    <p style="font-size:var(--text-sm);font-weight:700;color:var(--pa);line-height:1.6">${quote}</p>
  </div>

  <div class="insight-chip fade-up">📊 <span>Reality Check:</span> ${rcInsight}</div>

  <div class="sec-head fade-up">
    <span class="sec-title">Today's Habits</span>
    <span id="habits-count" style="font-size:var(--text-xs);color:var(--muted);font-weight:700">${doneCount}/${_S.habits.length} done</span>
  </div>

  ${_S.habits.map((habit, i) => habitCardHTML(habit, todayLog[habit.id], streaks[habit.id], i)).join('')}

  <div class="quick-row fade-up">
    <button onclick="window.openMoodModal()" class="action-btn ${todayMood ? 'active' : ''}">
      <span style="font-size:20px">${todayMood ? esc(MOODS.find((m) => m.v === todayMood.val)?.e || '😊') : '😶'}</span>
      <span>${todayMood ? esc(MOODS.find((m) => m.v === todayMood.val)?.l || 'Mood') : 'Mood'}</span>
    </button>
    <button onclick="window.openJournalModal()" class="action-btn ${todayNote ? 'active' : ''}">
      <span style="font-size:20px">📝</span>
      <span>${todayNote ? 'Notes ✓' : 'Notes'}</span>
    </button>
    <button onclick="window.openLeakLogger()" class="action-btn ${leakMins > 0 ? 'active' : ''}"
      style="${leakMins > 0 ? 'background:#fff3ec;border-color:#f0a878;' : ''}">
      <span style="font-size:20px">⏳</span>
      <span>${leakMins > 0 ? leakMins + 'm' : 'Leaks'}</span>
    </button>
  </div>

  <button onclick="window.openQuickAddTask()" class="fade-up" style="width:100%;padding:13px 16px;border-radius:var(--r-md);
    background:#fff;border:1.5px solid var(--p);display:flex;align-items:center;gap:12px;
    box-shadow:var(--sh-1);transition:all var(--t-base);margin-bottom:10px">
    <span style="font-size:22px">📌</span>
    <div style="flex:1;text-align:left">
      <p style="font-weight:800;font-size:var(--text-sm);color:var(--text)">Add a Task</p>
      <p style="font-size:var(--text-xs);color:var(--muted);font-weight:600">Quick-add to today's plan</p>
    </div>
    <span style="font-size:16px;color:var(--muted)">+</span>
  </button>

  <button onclick="window.openAudit()" class="fade-up" style="width:100%;padding:14px 16px;border-radius:var(--r-md);
    background:${auditDone ? '#e8fff4' : '#fff'};border:1.5px solid ${auditDone ? '#58c890' : 'var(--p)'};
    display:flex;align-items:center;gap:12px;box-shadow:var(--sh-1);transition:all var(--t-base);margin-bottom:8px">
    <span style="font-size:22px">${auditDone ? '✅' : '🌙'}</span>
    <div style="flex:1;text-align:left">
      <p style="font-weight:800;font-size:var(--text-sm);color:${auditDone ? '#1ea86a' : 'var(--text)'}">
        ${auditDone ? 'Audit Done! Tap to review' : 'End-of-Day Audit'}
      </p>
      <p style="font-size:var(--text-xs);color:var(--muted);font-weight:600">~90 sec reflection</p>
    </div>
    <span style="font-size:16px;color:var(--muted)">›</span>
  </button>`)
}

function habitCardHTML(habit, log, streak, index) {
  const isDone = log?.done
  return `
  <div class="habit-card${isDone ? ' done' : ''} fade-up" data-habit-id="${habit.id}" style="animation-delay:${index * 45}ms">
    <button class="habit-toggle${isDone ? ' done' : ''}" onclick="window.toggleHabitUI('${habit.id}')">
      ${isDone ? '<span style="font-size:18px">✓</span>' : `<span style="font-size:20px">${esc(habit.icon)}</span>`}
    </button>
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:6px">
        <span class="habit-name${isDone ? ' done' : ''}">${esc(habit.name)}</span>
        ${streak > 0 ? `<span class="streak"><span class="flame">🔥</span>${streak}</span>` : ''}
      </div>
      <span style="font-size:11px;color:var(--muted);font-weight:600">Target: ${habit.target} ${esc(habit.unit)}</span>
    </div>
    <span class="habit-done-badge" style="font-size:18px;${isDone ? '' : 'display:none'}">🎉</span>
  </div>`
}

/* ── PAGE: Habits ── */
export function pageHabits() {
  const stats = getStats()
  render(`
  <div class="pg-head fade-up">
    <h2 class="pg-title">My Habits ✅</h2>
    <button class="btn-sm" onclick="window.openAddHabit()" style="background:var(--pd);color:#fff">+ Add</button>
  </div>
  ${_S.habits.map((habit, i) => {
    const totalDone = Object.values(_S.logs).filter((dayLog) => dayLog[habit.id]?.done).length
    const streak = stats.streaks[habit.id] || 0
    return `
    <div class="card fade-up" style="animation-delay:${i * 45}ms">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:28px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;
          background:var(--pl);border-radius:14px;flex-shrink:0">${esc(habit.icon)}</span>
        <div style="flex:1">
          <p style="font-weight:800;font-size:15px">${esc(habit.name)}</p>
          <p style="font-size:11px;color:var(--muted);font-weight:600">${habit.target} ${esc(habit.unit)}/day · ${totalDone} total done</p>
        </div>
        ${streak > 0 ? `<span class="streak"><span class="flame">🔥</span>${streak}</span>` : ''}
        <button class="icon-btn icon-btn-edit" onclick="window.openEditHabit('${habit.id}')">✏️</button>
        <button class="icon-btn icon-btn-del" onclick="window.deleteHabitUI('${habit.id}')">🗑️</button>
      </div>
    </div>`
  }).join('')}`)
}

export function openAddHabit() { habitFormModal(null) }
export function openEditHabit(hid) { habitFormModal(_S.habits.find((h) => h.id === hid)) }

function habitFormModal(habit) {
  const currentIcon = habit?.icon || '⭐'
  UI.reset()
  UI.set('habitIcon', currentIcon)
  showModal(habit ? 'Edit Habit ✏️' : 'New Habit ✨', `
    <div class="label">Icon</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
      ${ICONS.map((ic) => `
        <button onclick="window.selectInGrid('hic','habitIcon','${ic}')" id="hic-${ic}"
          style="font-size:20px;width:36px;height:36px;border-radius:9px;transition:all .2s;
          background:${currentIcon === ic ? 'var(--p)' : 'var(--pl)'};
          border:1.5px solid ${currentIcon === ic ? 'var(--pd)' : 'transparent'}">${ic}</button>`).join('')}
    </div>
    <div class="label">Name</div>
    <input class="inp" id="hf-name" value="${esc(habit?.name || '')}" placeholder="Habit name"/>
    <div style="display:flex;gap:10px">
      <div style="flex:1">
        <div class="label">Target</div>
        <input class="inp" id="hf-target" type="number" value="${habit?.target || 1}" style="margin-bottom:0"/>
      </div>
      <div style="flex:1">
        <div class="label">Unit</div>
        <input class="inp" id="hf-unit" value="${esc(habit?.unit || 'session')}" placeholder="hrs/min/session" style="margin-bottom:0"/>
      </div>
    </div>
    <div style="height:14px"></div>
    <button class="btn-primary" onclick="window.saveHabit('${habit?.id || ''}')"
      style="background:linear-gradient(135deg,var(--pd),var(--pa))">Save Habit ✓</button>`)
}

export function saveHabit(habitId) {
  const name = document.getElementById('hf-name').value.trim()
  if (!name) return
  const data = {
    icon: UI.get('habitIcon', '⭐'),
    name,
    target: parseInt(document.getElementById('hf-target').value) || 1,
    unit: document.getElementById('hf-unit').value || 'session',
  }
  if (habitId) {
    updateHabit(habitId, data)
  } else {
    addHabit({ ...data, uid: Math.random().toString(36).slice(2, 9) })
  }
  closeModal()
  pageHabits()
}

export function deleteHabitUI(habitId) {
  if (!confirm('Delete this habit?')) return
  deleteHabit(habitId)
  pageHabits()
}

/* ── PAGE: Planner ── */
export function pagePlanner() {
  const td = today()
  const todayTasks = _S.tasks.filter((t) => t.date === td).sort((a, b) => a.time.localeCompare(b.time))
  const energyLevel = _S.energy[td] || 2
  const ES = ENERGY_SUGGEST[energyLevel]
  render(`
  <div class="pg-head fade-up">
    <h2 class="pg-title">Today's Plan 📅</h2>
    <button class="btn-sm" onclick="window.openAddTask()" style="background:var(--pd);color:#fff">+ Task</button>
  </div>
  <div style="background:${ES.color}50;border:1.5px solid ${ES.textColor}30;border-radius:14px;
    padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px" class="fade-up">
    <span>${ES.icon}</span>
    <span style="font-size:12px;font-weight:700;color:${ES.textColor}">${ES.label} day — ${esc(ES.tip)}</span>
  </div>
  ${todayTasks.length === 0 ? `
    <div class="empty-state fade-up">
      <span class="empty-state-icon">🌸</span>
      <p class="empty-state-title">Nothing planned yet</p>
      <p class="empty-state-sub">Add your first task and start turning intentions into actions.</p>
      <button onclick="window.openAddTask()" class="btn-sm" style="background:linear-gradient(135deg,var(--pd),var(--pa));color:#fff">+ Add First Task</button>
    </div>` : todayTasks.map((task, i) => `
    <div class="card fade-up" style="animation-delay:${i * 45}ms;padding:13px 14px;opacity:${task.done ? .85 : 1}">
      <div style="display:flex;align-items:center;gap:10px">
        <button onclick="window.toggleTask('${task.id}')" style="width:28px;height:28px;border-radius:8px;flex-shrink:0;
          background:${task.done ? 'var(--pd)' : 'var(--pl)'};border:2px solid var(--p);font-size:14px;
          display:flex;align-items:center;justify-content:center">${task.done ? '✓' : ''}</button>
        <div style="flex:1;min-width:0">
          <p style="font-weight:800;font-size:14px;text-decoration:${task.done ? 'line-through' : 'none'};
            color:${task.done ? 'var(--muted)' : 'var(--text)'}">${esc(task.title)}</p>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            ${task.carriedFrom ? '<span style="font-size:10px;color:var(--pa);font-weight:800;background:var(--pl);padding:1px 6px;border-radius:99px">↩ carried</span>' : ''}
            ${task.time ? `<span style="font-size:11px;color:var(--muted);font-weight:600">⏰ ${task.time}</span>` : ''}
            ${task.plannedMins ? `<span style="font-size:11px;color:var(--muted);font-weight:600">· ${task.plannedMins}m planned</span>` : ''}
            ${task.done && task.actualMins ? `<span style="font-size:11px;color:#1ea86a;font-weight:700">· ${task.actualMins}m actual</span>` : ''}
          </div>
        </div>
        <span class="prio ${task.priority}">${task.priority}</span>
      </div>
      ${!task.done ? `
      <div style="display:flex;gap:7px;margin-top:10px">
        <button class="focus-btn" onclick="window.openFocusPicker('${task.id}','${esc(task.title)}')">🔒 Focus</button>
        <button class="del-btn" onclick="window.deleteTask('${task.id}')">✕</button>
      </div>` : `
      <div style="margin-top:8px">
        <button class="ghost-btn" onclick="window.deleteTask('${task.id}')">Remove</button>
      </div>`}
    </div>`).join('')}`)
}

export function openAddTask() {
  UI.reset()
  UI.set('taskPrio', 'Medium')
  showModal('Add Task 📌', `
    <div class="label">Task</div>
    <input class="inp" id="tf-title" placeholder="What do you want to do?"/>
    <div style="display:flex;gap:10px">
      <div style="flex:1">
        <div class="label">Time (opt)</div>
        <input class="inp" id="tf-time" type="time" style="margin-bottom:0"/>
      </div>
      <div style="flex:1">
        <div class="label">Planned (min)</div>
        <input class="inp" id="tf-planned" type="number" placeholder="e.g. 30" style="margin-bottom:0"/>
      </div>
    </div>
    <div style="height:10px"></div>
    <div class="label">Priority</div>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      ${['High', 'Medium', 'Low'].map((p) => `
        <button onclick="window.selectTaskPrio('${p}')" id="prio-${p}"
          style="flex:1;padding:9px;border-radius:11px;font-size:12px;font-weight:800;
          transition:all .2s;cursor:pointer;background:${p === 'Medium' ? PRIO_COLS[p][0] : 'var(--pl)'};
          border:1.5px solid ${p === 'Medium' ? PRIO_COLS[p][1] : 'var(--p)'};
          color:${p === 'Medium' ? PRIO_COLS[p][1] : 'var(--muted)'}">${p}</button>`).join('')}
    </div>
    <button class="btn-primary" onclick="window.saveTask()"
      style="background:linear-gradient(135deg,var(--pd),var(--pa))">Add Task ✓</button>`)
}

export function selectTaskPrio(p) {
  UI.set('taskPrio', p)
  ;['High', 'Medium', 'Low'].forEach((x) => {
    const b = document.getElementById('prio-' + x)
    if (!b) return
    b.style.background = x === p ? PRIO_COLS[x][0] : 'var(--pl)'
    b.style.color = x === p ? PRIO_COLS[x][1] : 'var(--muted)'
    b.style.borderColor = x === p ? PRIO_COLS[x][1] : 'var(--p)'
  })
}

export function saveTask() {
  const title = document.getElementById('tf-title').value.trim()
  if (!title) return
  _S.tasks = [..._S.tasks, {
    id: uid(), title, time: document.getElementById('tf-time').value,
    priority: UI.get('taskPrio', 'Medium'),
    plannedMins: parseInt(document.getElementById('tf-planned')?.value) || 0,
    date: today(), done: false,
  }]
  saveState(_S)
  closeModal()
  pagePlanner()
}

/* ── Quick Add Task ── */
export function openQuickAddTask() {
  UI.reset()
  UI.set('taskPrio', 'Medium')
  showModal('Quick Add Task 📌', `
    <input class="inp" id="qt-title" placeholder="What do you want to do today?" autofocus/>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      ${['High', 'Medium', 'Low'].map((p) => `
        <button onclick="window.selectQTPrio('${p}')" id="qprio-${p}"
          style="flex:1;padding:9px;border-radius:var(--r-sm);font-size:12px;font-weight:800;
          transition:all var(--t-base);cursor:pointer;background:${p === 'Medium' ? PRIO_COLS[p][0] : 'var(--pl)'};
          border:1.5px solid ${p === 'Medium' ? PRIO_COLS[p][1] : 'var(--p)'};
          color:${p === 'Medium' ? PRIO_COLS[p][1] : 'var(--muted)'}">${p}</button>`).join('')}
    </div>
    <button class="btn-primary" onclick="window.saveQuickTask()"
      style="background:linear-gradient(135deg,var(--pd),var(--pa))">Add Task ✓</button>`)
}

export function saveQuickTask() {
  const title = document.getElementById('qt-title')?.value.trim()
  if (!title) return
  _S.tasks = [..._S.tasks, { id: uid(), title, time: '', plannedMins: 0, priority: UI.get('taskPrio', 'Medium'), date: today(), done: false }]
  saveState(_S)
  closeModal()
  showToast('Task added to today\'s plan 📌', 'var(--pl)', 'var(--pa)')
}

/* ── Tasks ── */
export function toggleTask(taskId) {
  _S.tasks = _S.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t)
  saveState(_S)
  pagePlanner()
}

export function deleteTask(taskId) {
  _S.tasks = _S.tasks.filter((t) => t.id !== taskId)
  saveState(_S)
  pagePlanner()
}

/* ── Mood ── */
export function openMoodModal() {
  const td = today()
  const current = _S.moods[td]
  showModal('How are you feeling? 💭', `
    <p style="font-size:var(--text-xs);color:var(--muted);font-weight:600;margin-bottom:14px">
      Tap once — takes 2 seconds. Honest logging = better insights.
    </p>
    <div style="display:flex;justify-content:space-between;gap:6px">
      ${MOODS.map((mood) => `
        <button onclick="window.saveMoodUI(${mood.v})" style="display:flex;flex-direction:column;align-items:center;gap:5px;
          padding:12px 6px;border-radius:var(--r-md);flex:1;
          background:${current?.val === mood.v ? 'var(--p)' : 'var(--pl)'};
          border:1.5px solid ${current?.val === mood.v ? 'var(--pd)' : 'transparent'};
          transition:all var(--t-base);cursor:pointer">
          <span style="font-size:28px">${mood.e}</span>
          <span style="font-size:10px;font-weight:800;color:var(--muted)">${mood.l}</span>
          ${current?.val === mood.v ? '<span style="font-size:9px;color:var(--pa);font-weight:900">✓</span>' : ''}
        </button>`).join('')}
    </div>`)
}

export function saveMoodUI(val) {
  saveMood(val)
  closeModal()
  pageHome()
}

/* ── Journal ── */
export function openJournalModal() {
  const existing = _S.journal[today()] || ''
  showModal("Today's Notes 📝", `
    <textarea class="inp" id="journal-text" placeholder="Write anything — thoughts, reflections, how your day went..."
      style="height:140px;resize:none;margin-bottom:12px">${esc(existing)}</textarea>
    <button class="btn-primary" onclick="window.saveJournalUI()"
      style="background:linear-gradient(135deg,var(--pd),var(--pa))">Save ✓</button>`)
}

export function saveJournalUI() {
  const text = document.getElementById('journal-text').value
  saveJournal(text)
  closeModal()
  pageHome()
}

/* ── Energy ── */
export function openEnergyPicker() {
  const current = _S.energy[today()] || null
  showModal("⚡ Today's Energy Level", `
    <p style="font-size:13px;color:var(--muted);font-weight:600;margin-bottom:16px">
      How charged are you? This helps suggest the right tasks.
    </p>
    ${[1, 2, 3].map((level) => {
      const es = ENERGY_SUGGEST[level]
      return `
      <button onclick="window.setEnergyUI(${level})" style="width:100%;padding:14px 16px;border-radius:16px;
        background:${current === level ? es.color : '#fff'};border:1.5px solid ${current === level ? es.textColor : 'var(--p)'};
        margin-bottom:10px;text-align:left;cursor:pointer;transition:all .2s;display:block">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <span style="font-size:22px">${es.icon}</span>
          <span style="font-weight:900;font-size:15px;color:${es.textColor}">${es.label}</span>
          ${current === level ? '<span style="font-size:11px;font-weight:800;color:' + es.textColor + ';margin-left:auto">Selected ✓</span>' : ''}
        </div>
        <p style="font-size:12px;color:var(--muted);font-weight:600;padding-left:32px">${esc(es.tip)}</p>
      </button>`
    }).join('')}`)
}

export function setEnergyUI(val) {
  setEnergy(val)
  closeModal()
  if (currentTab === 'home') pageHome()
  if (currentTab === 'planner') pagePlanner()
}

/* ── Time Leak ── */
export function openLeakLogger() {
  const td = today()
  const todayLeaks = _S.leaks[td] || []
  const totalMins = todayLeaks.reduce((s, lk) => s + lk.mins, 0)
  UI.reset()
  showModal('⏳ Time Leak Tracker', `
    <p style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:14px">
      What distracted you today? Be honest 🌿
    </p>
    <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px">
      ${LEAK_PRESETS.map((preset) => `
        <button onclick="window.selectLeakPreset('${preset.l}')" id="lk-${preset.l.replace(/\s/g, '-')}"
          style="padding:7px 12px;border-radius:11px;font-size:12px;font-weight:800;
          background:var(--pl);border:1.5px solid var(--p);transition:all .2s;cursor:pointer">
          ${preset.i} ${preset.l}
        </button>`).join('')}
    </div>
    <input class="inp" id="leak-custom" placeholder="Or type custom activity"/>
    <div class="label">Time wasted (minutes)</div>
    <input type="number" class="inp" id="leak-mins" value="15" min="1" max="300"/>
    <button class="btn-primary" onclick="window.saveLeakEntry()"
      style="background:linear-gradient(135deg,#f8d4b8,#f0a878);color:#6a3a10;margin-bottom:14px">Log Time Leak</button>
    ${todayLeaks.length > 0 ? `
      <div style="border-top:1.5px solid var(--p);padding-top:14px">
        <p style="font-size:12px;font-weight:800;color:var(--muted);margin-bottom:10px">TODAY — ${totalMins} min lost</p>
        ${todayLeaks.map((lk) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;
            border-bottom:1px solid var(--pl);font-size:13px">
            <span style="font-weight:700">${esc(lk.label)}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-weight:800;color:#c87820">${lk.mins}m</span>
              <button onclick="window.removeLeak('${lk.id}')"
                style="font-size:13px;color:#c84040;padding:2px 6px;border-radius:7px;background:#fff5f5;cursor:pointer">✕</button>
            </div>
          </div>`).join('')}
      </div>` : ''}`)
}

export function selectLeakPreset(label) {
  UI.set('leakLabel', label)
  LEAK_PRESETS.forEach((p) => {
    const btn = document.getElementById('lk-' + p.l.replace(/\s/g, '-'))
    if (!btn) return
    btn.style.background = p.l === label ? 'var(--p)' : 'var(--pl)'
    btn.style.borderColor = p.l === label ? 'var(--pd)' : 'var(--p)'
  })
  const ci = document.getElementById('leak-custom')
  if (ci) ci.value = ''
}

export function saveLeakEntry() {
  const customLabel = document.getElementById('leak-custom')?.value.trim()
  const label = customLabel || UI.get('leakLabel', 'Distraction')
  const mins = parseInt(document.getElementById('leak-mins')?.value) || 15
  const leaks = { ..._S.leaks }
  leaks[today()] = [...(leaks[today()] || []), { label, mins, id: uid() }]
  _S.leaks = leaks
  saveState(_S)
  closeModal()
  openLeakLogger()
}

export function removeLeak(leakId) {
  const leaks = { ..._S.leaks }
  leaks[today()] = (leaks[today()] || []).filter((lk) => lk.id !== leakId)
  _S.leaks = leaks
  saveState(_S)
  closeModal()
  openLeakLogger()
}

/* ── Audit ── */
export function openAudit() {
  const existing = _S.audits[today()]
  const el = document.createElement('div')
  el.id = 'audit-popup'
  el.innerHTML = `
    <div class="audit-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div>
          <p style="font-weight:900;font-size:18px">End-of-Day Audit 🌙</p>
          <p style="font-size:11px;color:var(--muted);font-weight:600">Takes ~90 seconds. Be honest.</p>
        </div>
        <button onclick="window.closeAudit()" class="modal-close">✕</button>
      </div>
      <div class="audit-step active" id="audit-s1">
        <p style="font-size:22px;margin-bottom:6px">✅</p>
        <p style="font-weight:800;font-size:15px;margin-bottom:4px">What went right today?</p>
        <p style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:12px">Even small wins count</p>
        <textarea class="inp" id="audit-right" placeholder="e.g. Finished Physics chapter, slept on time..." style="height:100px;resize:none">${esc(existing?.right || '')}</textarea>
        <button class="btn-primary" onclick="window.auditStep(1,2)" style="background:linear-gradient(135deg,var(--pd),var(--pa))">Next →</button>
      </div>
      <div class="audit-step" id="audit-s2">
        <p style="font-size:22px;margin-bottom:6px">⏳</p>
        <p style="font-weight:800;font-size:15px;margin-bottom:4px">What wasted your time?</p>
        <p style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:12px">No judgment — just awareness</p>
        <textarea class="inp" id="audit-waste" placeholder="e.g. 2hrs on Reels, phone before sleep..." style="height:100px;resize:none">${esc(existing?.waste || '')}</textarea>
        <div style="display:flex;gap:10px">
          <button class="back-btn" onclick="window.auditStep(2,1)">← Back</button>
          <button class="next-btn" onclick="window.auditStep(2,3)">Next →</button>
        </div>
      </div>
      <div class="audit-step" id="audit-s3">
        <p style="font-size:22px;margin-bottom:6px">🚀</p>
        <p style="font-weight:800;font-size:15px;margin-bottom:4px">What will you improve tomorrow?</p>
        <p style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:12px">One specific action</p>
        <textarea class="inp" id="audit-improve" placeholder="e.g. Start studying by 8am, no phone till 10am..." style="height:100px;resize:none">${esc(existing?.improve || '')}</textarea>
        <div style="display:flex;gap:10px">
          <button class="back-btn" onclick="window.auditStep(3,2)">← Back</button>
          <button style="flex:1;padding:12px;border-radius:13px;color:#fff;font-weight:800;font-size:14px;background:linear-gradient(135deg,#58c890,#1ea86a);border:none;cursor:pointer" onclick="window.saveAuditUI()">Save ✓</button>
        </div>
      </div>
    </div>`
  document.body.appendChild(el)
}

export function auditStep(fromStep, toStep) {
  document.getElementById('audit-s' + fromStep).classList.remove('active')
  document.getElementById('audit-s' + toStep).classList.add('active')
}

export function saveAuditUI() {
  const right = document.getElementById('audit-right')?.value || ''
  const waste = document.getElementById('audit-waste')?.value || ''
  const improve = document.getElementById('audit-improve')?.value || ''
  _S.audits = { ..._S.audits, [today()]: { right, waste, improve, date: today() } }
  saveState(_S)
  closeAudit()
  showToast('Audit saved! Great self-awareness 🌙', 'var(--pl)', 'var(--pa)')
  if (currentTab === 'home') pageHome()
  catSetState('happy', true)
  clearTimeout(_catHappyTimer)
  _catHappyTimer = setTimeout(() => catSetState('neutral', false), 3500)
}

export function closeAudit() {
  const el = document.getElementById('audit-popup')
  if (el) el.remove()
}

export function openAuditHistory() {
  const entries = Object.entries(_S.audits).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7)
  showModal('📋 Audit History',
    entries.length === 0
      ? '<p style="text-align:center;color:var(--muted);padding:20px;font-weight:600">No audits yet. Do your first one tonight!</p>'
      : entries.map(([d, audit]) => `
          <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1.5px solid var(--pl)">
            <p style="font-weight:800;font-size:12px;color:var(--pa);margin-bottom:8px">${new Date(d).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            <p style="font-size:12px;margin-bottom:4px"><b style="color:var(--muted)">✅ Right:</b> ${esc(audit.right || '—')}</p>
            <p style="font-size:12px;margin-bottom:4px"><b style="color:var(--muted)">⏳ Wasted:</b> ${esc(audit.waste || '—')}</p>
            <p style="font-size:12px"><b style="color:var(--muted)">🚀 Improve:</b> ${esc(audit.improve || '—')}</p>
          </div>`).join(''))
}

/* ── PAGE: Timer ── */
export function pageTimer() {
  const pm = _S.pom
  const isWork = pm.phase === 'work'
  const total = isWork ? pm.work * 60 : pm.brk * 60
  const pct = (total - pm.left) / total * 100
  const size = 200, stroke = 10, r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r, off = circ * (1 - pct / 100)
  render(`
  <div style="padding-top:20px">
  <h2 class="pg-title fade-up" style="margin-bottom:20px">Focus Timer ⏱️</h2>
  <div style="display:flex;justify-content:center;margin-bottom:28px" class="fade-up">
    <div style="position:relative;width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pl)" stroke-width="${stroke}"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
          stroke="${isWork ? 'var(--pd)' : '#58c890'}" stroke-width="${stroke}"
          stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
          stroke-linecap="round" style="transition:stroke-dashoffset 1.05s linear" id="pom-arc"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <span id="pom-time" style="font-size:46px;font-weight:900;font-variant-numeric:tabular-nums;color:var(--text)">${fmtTime(pm.left)}</span>
        <span id="pom-phase" style="font-size:12px;font-weight:800;color:${isWork ? 'var(--pa)' : '#1ea86a'};text-transform:uppercase;letter-spacing:1px">${isWork ? 'Focus' : 'Break'}</span>
        <span style="font-size:11px;color:var(--muted);font-weight:600;margin-top:3px">Session ${pm.sessions + 1}</span>
      </div>
    </div>
  </div>
  <div style="display:flex;justify-content:center;gap:14px;margin-bottom:24px" class="fade-up">
    <button onclick="window.pomReset()" style="width:52px;height:52px;border-radius:var(--r-sm);background:var(--pl);border:1.5px solid var(--p);font-size:20px;transition:all var(--t-base)">↺</button>
    <button onclick="window.pomToggle()" style="width:68px;height:68px;border-radius:20px;font-size:24px;
      background:${pm.running ? 'linear-gradient(135deg,#f8c8c8,#f0a0a0)' : 'linear-gradient(135deg,var(--pl),var(--pd))'};
      border:2px solid ${pm.running ? '#f0a0a0' : 'var(--p)'};box-shadow:var(--sh-2);transition:all var(--t-base)">
      ${pm.running ? '⏸' : '▶'}
    </button>
    <button onclick="window.pomSkip()" style="width:52px;height:52px;border-radius:var(--r-sm);background:var(--pl);border:1.5px solid var(--p);font-size:20px;transition:all var(--t-base)">⏭</button>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:var(--text-xs);color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px">Settings</p>
    <div style="display:flex;gap:12px">
      <div style="flex:1">
        <div class="label">Focus (min)</div>
        <input type="number" class="inp" id="pom-work" min="1" max="90" value="${pm.work}" onchange="window.pomSetWork(this.value)" style="text-align:center;font-size:18px;font-weight:900;margin-bottom:0"/>
      </div>
      <div style="flex:1">
        <div class="label">Break (min)</div>
        <input type="number" class="inp" id="pom-brk" min="1" max="30" value="${pm.brk}" onchange="window.pomSetBrk(this.value)" style="text-align:center;font-size:18px;font-weight:900;margin-bottom:0"/>
      </div>
    </div>
  </div>
  ${pm.sessions > 0 ? `
    <div style="background:var(--pl);border-radius:var(--r-md);padding:12px 16px;display:flex;align-items:center;gap:8px" class="fade-up">
      <span style="font-size:20px">🎯</span>
      <span style="font-weight:800;font-size:var(--text-sm);color:var(--pa)">${pm.sessions} session${pm.sessions > 1 ? 's' : ''} completed today!</span>
    </div>` : ''}
  </div>`)
}

export function _patchTimerDOM() {
  const pm = _S.pom
  const timeEl = document.getElementById('pom-time')
  const arcEl = document.getElementById('pom-arc')
  if (!timeEl) return
  timeEl.textContent = fmtTime(pm.left)
  if (arcEl) {
    const isWork = pm.phase === 'work'
    const total = isWork ? pm.work * 60 : pm.brk * 60
    const size = 200, stroke = 10, r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r
    arcEl.style.strokeDashoffset = (circ * (1 - (total - pm.left) / total)).toFixed(1)
  }
}

export function pomToggle() {
  _S.pom.running = !_S.pom.running
  haptic('light')
  if (_S.pom.running) {
    clearInterval(pomTimer)
    pomTimer = setInterval(() => {
      _S.pom.left--
      if (_S.pom.left <= 0) {
        clearInterval(pomTimer)
        const wasWork = _S.pom.phase === 'work'
        _S.pom.phase = wasWork ? 'break' : 'work'
        _S.pom.left = wasWork ? _S.pom.brk * 60 : _S.pom.work * 60
        if (wasWork) _S.pom.sessions++
        _S.pom.running = false
        saveState(_S)
        haptic('success')
        if (currentTab === 'timer') pageTimer()
        return
      }
      _patchTimerDOM()
    }, 1000)
  } else {
    clearInterval(pomTimer)
    saveState(_S)
  }
  if (currentTab === 'timer') pageTimer()
}

export function pomReset() {
  clearInterval(pomTimer)
  _S.pom = { ..._S.pom, running: false, left: _S.pom.work * 60, phase: 'work' }
  saveState(_S)
  if (currentTab === 'timer') pageTimer()
}

export function pomSkip() {
  clearInterval(pomTimer)
  const wasWork = _S.pom.phase === 'work'
  _S.pom.phase = wasWork ? 'break' : 'work'
  _S.pom.left = wasWork ? _S.pom.brk * 60 : _S.pom.work * 60
  _S.pom.running = false
  saveState(_S)
  if (currentTab === 'timer') pageTimer()
}

export function pomSetWork(v) {
  _S.pom.work = parseInt(v) || 25
  if (!_S.pom.running) { _S.pom.left = _S.pom.work * 60; _S.pom.phase = 'work' }
  saveState(_S)
}

export function pomSetBrk(v) { _S.pom.brk = parseInt(v) || 5; saveState(_S) }

/* ── PAGE: Stats ── */
export function pageStats() {
  weekDates()
  const weekData = getWeeklyChartData()
  const moodData = getMoodData()
  const totalW = weekData.reduce((sum, d) => sum + d.done, 0)
  const bestDay = weekData.reduce((a, b) => b.pct > a.pct ? b : a, weekData[0])
  const moodVals = moodData.filter((m) => m.val)
  const moodAvg = moodVals.length ? moodVals.reduce((s, m) => s + m.val, 0) / moodVals.length : 0
  const rcData = getRealityData()
  const rcInsight = getRCInsight()
  const leakData = getLeakData()
  const maxLeak = Math.max(...leakData.map((d) => d.mins), 1)
  const totalLeakW = leakData.reduce((s, d) => s + d.mins, 0)
  const energyData = getEnergyData()
  const ECOLS = { 0: '#eee', 1: '#f8c8c8', 2: '#f8e8b8', 3: '#c8f8e0' }
  const EICONS = { 0: '·', 1: '🪫', 2: '⚡', 3: '🚀' }
  const barH = 70
  render(`
  <div style="padding-top:20px">
  <h2 class="pg-title fade-up" style="margin-bottom:14px">Weekly Stats 📊</h2>
  <div class="card fade-up" style="background:linear-gradient(135deg,var(--pl),var(--p)30);border-color:var(--pd);margin-bottom:14px">
    <p style="font-size:var(--text-xs);font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">This Week's Insight</p>
    <p style="font-size:var(--text-base);font-weight:700;color:var(--text);line-height:1.5">${getWeeklyInsight()}</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px" class="fade-up">
    ${[
      { l: 'This Week', v: totalW + ' done', i: '✅', c: 'var(--pl)' },
      { l: 'Best Day', v: bestDay.label, i: '🏆', c: '#fffbe8' },
      { l: 'Avg Mood', v: moodAvg ? moodAvg.toFixed(1) + '/5' : '—', i: '😊', c: '#fff0f8' },
      { l: 'Time Leaked', v: totalLeakW + 'm', i: '⏳', c: '#fff3ec' },
    ].map((card) => `
      <div style="background:${card.c};border:1.5px solid var(--p);border-radius:18px;padding:14px 12px;box-shadow:var(--sh-1)">
        <span style="font-size:22px">${card.i}</span>
        <p style="font-weight:900;font-size:20px;margin-top:3px">${card.v}</p>
        <p style="font-size:11px;color:var(--muted);font-weight:700">${card.l}</p>
      </div>`).join('')}
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:14px">Habit Completion Rate</p>
    <div style="display:flex;gap:5px;align-items:flex-end;height:${barH + 28}px">
      ${weekData.map((d) => `
        <div class="bar-col">
          <span style="font-size:10px;font-weight:800;color:var(--pa);min-height:14px">${d.pct > 0 ? d.pct + '%' : ''}</span>
          <div class="bar-wrap" style="height:${barH}px">
            <div class="bar-fill" style="height:${d.pct}%;min-height:${d.pct > 0 ? 4 : 0}px;background:linear-gradient(to top,var(--pd),var(--p))"></div>
          </div>
          <span style="font-size:10px;font-weight:700;color:var(--muted)">${d.label}</span>
        </div>`).join('')}
    </div>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:12px">📊 Reality Check</p>
    <div class="insight-chip" style="margin-bottom:12px;font-size:12px">${rcInsight}</div>
    ${rcData.map((d) => `
      <div class="rc-row">
        <span style="font-size:11px;font-weight:700;color:var(--muted);width:28px">${d.label}</span>
        <div style="flex:1">
          <div style="height:7px;background:#e8f4ff;border-radius:99px;margin-bottom:3px;overflow:hidden"><div style="height:100%;width:${d.planned > 0 ? 100 : 0}%;background:linear-gradient(to right,#b8d8f8,#7bbaf0);border-radius:99px"></div></div>
          <div style="height:7px;background:var(--pl);border-radius:99px;overflow:hidden"><div style="height:100%;width:${d.pct}%;background:linear-gradient(to right,var(--pd),var(--pa));border-radius:99px"></div></div>
        </div>
        <span style="font-size:11px;font-weight:800;color:var(--pa);width:30px;text-align:right">${d.pct}%</span>
      </div>`).join('')}
    <div style="display:flex;gap:12px;margin-top:10px">
      <div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:4px;border-radius:99px;background:#7bbaf0"></div><span style="font-size:10px;color:var(--muted);font-weight:700">Planned</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:4px;border-radius:99px;background:var(--pa)"></div><span style="font-size:10px;color:var(--muted);font-weight:700">Actual Done</span></div>
    </div>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:14px">⏳ Time Leaks This Week</p>
    <div style="display:flex;gap:5px;align-items:flex-end;height:70px;margin-bottom:6px">
      ${leakData.map((d) => `
        <div class="bar-col">
          <div class="bar-wrap" style="height:70px">
            <div class="bar-fill" style="height:${Math.round(d.mins / maxLeak * 100)}%;min-height:${d.mins > 0 ? 4 : 0}px;background:linear-gradient(to top,#f0a878,#f8d4b8)"></div>
          </div>
          <span style="font-size:9px;font-weight:700;color:var(--muted)">${d.label}</span>
        </div>`).join('')}
    </div>
    <p style="font-size:11px;color:var(--muted);font-weight:600;text-align:center">${totalLeakW === 0 ? 'No leaks logged this week! 🌟' : `Total: ${totalLeakW} mins lost`}</p>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:12px">⚡ Energy Trend</p>
    <div style="display:flex;gap:6px">
      ${energyData.map((d) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="width:100%;height:48px;border-radius:10px;background:${ECOLS[d.val]};display:flex;align-items:center;justify-content:center;font-size:18px;border:1.5px solid ${d.val ? 'transparent' : '#eee'}">${EICONS[d.val]}</div>
          <span style="font-size:9px;font-weight:700;color:var(--muted)">${d.label}</span>
        </div>`).join('')}
    </div>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:14px">Mood This Week</p>
    <div style="display:flex;gap:5px;align-items:flex-end;height:88px">
      ${moodData.map((d) => `
        <div class="bar-col">
          <span style="font-size:16px;min-height:20px">${d.val ? MOODS.find((m) => m.v === d.val)?.e : '·'}</span>
          <div class="bar-wrap" style="height:60px">
            <div class="bar-fill" style="height:${d.val / 5 * 100}%;min-height:${d.val ? 4 : 0}px;background:linear-gradient(to top,#f0a0c0,#f8d0e0)"></div>
          </div>
          <span style="font-size:10px;font-weight:700;color:var(--muted)">${d.label}</span>
        </div>`).join('')}
    </div>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:14px">Habit Consistency</p>
    ${getHabitConsistency().map((h) => `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-weight:700;font-size:13px">${esc(h.icon)} ${esc(h.name)}</span>
          <span style="font-size:12px;color:var(--muted);font-weight:700">${h.rate}%</span>
        </div>
        <div style="height:7px;background:var(--pl);border-radius:99px">
          <div style="height:100%;width:${h.rate}%;border-radius:99px;background:linear-gradient(to right,var(--pd),var(--pa))"></div>
        </div>
      </div>`).join('')}
  </div>
  <button onclick="window.openAuditHistory()" class="fade-up" style="width:100%;padding:13px;border-radius:var(--r-md);background:var(--pl);border:1.5px solid var(--p);font-weight:800;font-size:13px;color:var(--pa);margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px">🌙 View Audit History</button>
  </div>`)
}

/* ── PAGE: Settings ── */
export function pageSettings() {
  const profile = _S.profile || {}
  const stats = getStats()
  const earned = BADGES.filter((b) => b.q(stats)).map((b) => b.id)
  const prevEarned = new Set(_S.earnedBadges || [])
  const newlyEarned = earned.filter((id) => !prevEarned.has(id))
  if (newlyEarned.length > 0) {
    _S.earnedBadges = earned
    saveState(_S)
    newlyEarned.forEach((id) => {
      const badge = BADGES.find((b) => b.id === id)
      if (badge) setTimeout(() => showToast(`🏅 Badge unlocked: ${badge.n}! ${badge.i}`, 'var(--pl)', 'var(--pa)'), 400)
    })
  }
  const themes = getThemes()
  render(`
  <div style="padding-top:20px">
  <h2 class="pg-title fade-up" style="margin-bottom:18px">Settings ⚙️</h2>
  <div class="card fade-up">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
      <div style="width:58px;height:58px;border-radius:var(--r-md);background:var(--pl);display:flex;align-items:center;justify-content:center;font-size:28px;border:2px solid var(--p);flex-shrink:0">${esc(profile.avatar || '🌸')}</div>
      <div>
        <p style="font-weight:900;font-size:17px">${esc(profile.name || 'Friend')}</p>
        ${profile.bio ? `<p style="font-size:12px;color:var(--muted);font-weight:600">${esc(profile.bio)}</p>` : ''}
        ${profile.goal ? `<p style="font-size:12px;color:var(--pa);font-weight:700">🎯 ${esc(profile.goal)}</p>` : ''}
      </div>
    </div>
    <button onclick="window.openEditProfile()" style="width:100%;padding:10px;border-radius:var(--r-sm);background:var(--pl);border:1.5px solid var(--p);font-weight:800;font-size:13px;color:var(--pa)">✏️ Edit Profile</button>
  </div>
  <div class="card fade-up">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <p style="font-weight:800;font-size:14px">🌙 Dark Mode</p>
      <label style="position:relative;display:inline-block;width:44px;height:24px">
        <input type="checkbox" onchange="window.toggleDarkModeUI()" ${getDarkMode() ? 'checked' : ''} style="opacity:0;width:0;height:0"/>
        <span style="position:absolute;cursor:pointer;inset:0;background:${getDarkMode() ? 'var(--pd)' : '#ccc'};border-radius:12px;transition:all .3s">
          <span style="position:absolute;content:'';height:20px;width:20px;border-radius:50%;background:#fff;top:2px;transition:all .3s;${getDarkMode() ? 'transform:translateX(20px)' : 'left:2px'}"></span>
        </span>
      </label>
    </div>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:14px">🎨 Theme Color</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${Object.entries(themes).map(([id, theme]) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px">
          <button onclick="window.changeThemeUI('${id}')" class="theme-chip ${_S.theme === id ? 'active' : ''}" style="background:${theme.pd};outline-color:${theme.pd}"></button>
          <span style="font-size:10px;font-weight:700;color:var(--muted)">${theme.name}</span>
        </div>`).join('')}
    </div>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:14px">📦 Data</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button onclick="window.doExportUI()" style="flex:1;padding:10px;border-radius:var(--r-sm);background:var(--pl);border:1.5px solid var(--p);font-weight:800;font-size:12px;color:var(--pa)">⬇️ Export Data</button>
      <label style="flex:1;padding:10px;border-radius:var(--r-sm);background:var(--pl);border:1.5px solid var(--p);font-weight:800;font-size:12px;color:var(--pa);text-align:center;cursor:pointer;display:block">
        📥 Import Data
        <input type="file" accept=".json" onchange="window.doImportUI(event)" style="display:none"/>
      </label>
    </div>
  </div>
  <div class="card fade-up">
    <p style="font-weight:800;font-size:14px;margin-bottom:4px">🏅 Achievements</p>
    <p style="font-size:var(--text-xs);color:var(--muted);font-weight:600;margin-bottom:14px">${earned.length}/${BADGES.length} unlocked</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${BADGES.map((badge) => {
        const isEarned = earned.includes(badge.id)
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--r-md);background:${isEarned ? 'var(--pl)' : '#f8f8f8'};border:1.5px solid ${isEarned ? 'var(--p)' : '#eee'};opacity:${isEarned ? 1 : .55}">
          <span style="font-size:26px">${badge.i}</span>
          <div style="flex:1">
            <p style="font-weight:800;font-size:13px;color:${isEarned ? 'var(--text)' : 'var(--muted)'}">${badge.n}</p>
            <p style="font-size:11px;color:var(--muted);font-weight:600">${badge.d}</p>
          </div>
          ${isEarned ? '<span style="font-size:11px;font-weight:900;color:var(--pa)">Earned ✓</span>' : ''}
        </div>`
      }).join('')}
    </div>
  </div>
  <div class="card fade-up" style="background:var(--pl)">
    <p style="font-weight:800;font-size:14px;margin-bottom:12px">📈 All-Time Stats</p>
    <div style="display:flex;gap:16px">
      ${[
        { v: stats.total, l: 'Completions' },
        { v: stats.maxStreak, l: 'Best Streak' },
        { v: stats.moodDays, l: 'Mood Logs' },
      ].map((s) => `
        <div style="text-align:center">
          <p style="font-size:24px;font-weight:900">${s.v}</p>
          <p style="font-size:11px;color:var(--muted);font-weight:700">${s.l}</p>
        </div>`).join('')}
    </div>
  </div>
  <div style="background:#fff5f5;border:1.5px solid #f8c8c8;border-radius:var(--r-lg);padding:16px;margin-bottom:12px" class="fade-up">
    <p style="font-weight:800;font-size:13px;color:#c84040;margin-bottom:6px">⚠️ Danger Zone</p>
    <button onclick="window.resetHabitsUI()" style="padding:9px 16px;border-radius:var(--r-sm);background:#f8c8c8;border:1.5px solid #f0a0a0;font-weight:800;font-size:12px;color:#c84040">Reset Default Habits</button>
  </div>
  </div>`)
}

export function changeThemeUI(themeId) {
  changeTheme(themeId)
  pageSettings()
}

export function toggleDarkModeUI() {
  toggleDarkMode()
  pageSettings()
}

export function resetHabitsUI() {
  if (!confirm('Reset all habits to defaults?')) return
  resetHabits()
  pageSettings()
}

export function doExportUI() {
  doExport()
  showToast('Data exported! 📦', 'var(--pl)', 'var(--pa)')
}

export function doImportUI(event) {
  const file = event.target.files[0]
  if (!file) return
  doImport(file, () => {
    showToast('Data imported successfully! ✅', 'var(--pl)', 'var(--pa)')
    if (_S.profile) switchTab('home')
  })
}

export function openEditProfile() {
  const profile = _S.profile || {}
  UI.reset()
  UI.set('profileAvatar', profile.avatar || '🌸')
  showModal('Edit Profile ✏️', `
    <div class="label">Avatar</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
      ${renderAvatarGrid('pavi', 'profileAvatar', profile.avatar || '🌸')}
    </div>
    <div class="label">Name</div>
    <input class="inp" id="pf-name" value="${esc(profile.name || '')}"/>
    <div class="label">Bio</div>
    <input class="inp" id="pf-bio" value="${esc(profile.bio || '')}" placeholder="Short bio"/>
    <div class="label">Goal</div>
    <input class="inp" id="pf-goal" value="${esc(profile.goal || '')}" placeholder="Your main goal"/>
    <button class="btn-primary" onclick="window.saveProfileUI()" style="background:linear-gradient(135deg,var(--pd),var(--pa))">Save ✓</button>`)
}

export function saveProfileUI() {
  const name = document.getElementById('pf-name').value.trim()
  if (!name) return
  saveProfile({ ..._S.profile, name, bio: document.getElementById('pf-bio').value, goal: document.getElementById('pf-goal').value, avatar: UI.get('profileAvatar', _S.profile?.avatar || '🌸') })
  closeModal()
  pageSettings()
}

/* ── Focus Lock ── */
export function openFocusPicker(taskId, taskName) {
  UI.reset()
  UI.set('focusMins', 25)
  showModal(`🔒 Focus: ${esc(taskName)}`, `
    <p style="font-size:13px;color:var(--muted);font-weight:600;margin-bottom:16px;line-height:1.5">Set duration. Nav locks until you finish.</p>
    <div class="label">Duration (minutes)</div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      ${[15, 25, 30, 45, 60].map((m) => `
        <button onclick="window.selectFocusMins(${m})" id="fm-${m}" style="padding:9px 14px;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;background:${m === 25 ? 'var(--p)' : 'var(--pl)'};border:1.5px solid ${m === 25 ? 'var(--pd)' : 'var(--p)'}">${m}m</button>`).join('')}
    </div>
    <input type="number" class="inp" id="focus-custom-mins" placeholder="Or type custom minutes" min="1" max="180"/>
    <button class="btn-primary" onclick="window.launchFocus('${taskId}','${esc(taskName)}')" style="background:linear-gradient(135deg,var(--pd),var(--pa))">🔒 Start Focus Session</button>`)
  selectFocusMins(25)
}

export function selectFocusMins(mins) {
  UI.set('focusMins', mins)
  ;[15, 25, 30, 45, 60].forEach((m) => {
    const btn = document.getElementById('fm-' + m)
    if (!btn) return
    btn.style.background = m === mins ? 'var(--p)' : 'var(--pl)'
    btn.style.borderColor = m === mins ? 'var(--pd)' : 'var(--p)'
  })
}

export function launchFocus(taskId, taskName) {
  const customMins = parseInt(document.getElementById('focus-custom-mins')?.value) || 0
  const mins = customMins > 0 ? customMins : UI.get('focusMins', 25)
  closeModal()
  startFocusSession(taskId, taskName, mins)
}

function startFocusSession(taskId, taskName, mins) {
  clearInterval(focusTimer)
  const totalSecs = mins * 60
  _S.focus = { active: true, taskId, taskName, left: totalSecs, total: totalSecs, running: true }
  document.getElementById('nav').classList.add('locked')
  renderFocusOverlay()
  const rcDay = { ...(_S.rcData[today()] || {}) }
  if (!rcDay[taskId]) rcDay[taskId] = { planned: mins, actual: 0 }
  _S.rcData = { ..._S.rcData, [today()]: rcDay }
  saveState(_S)
  catSetState('focus', true)
  focusTimer = setInterval(() => {
    _S.focus.left--
    if (_S.focus.left <= 0) {
      clearInterval(focusTimer)
      _S.focus.running = false
      _S.focus.active = false
      _S.tasks = _S.tasks.map((t) => t.id === taskId ? { ...t, done: true, actualMins: mins } : t)
      const rcD = { ...(_S.rcData[today()] || {}) }
      if (rcD[taskId]) rcD[taskId].actual = mins
      _S.rcData = { ..._S.rcData, [today()]: rcD }
      saveState(_S)
      document.getElementById('nav').classList.remove('locked')
      removeFocusOverlay()
      showToast(`✅ "${esc(taskName)}" complete! Great session 🎉`, 'var(--pl)', 'var(--pa)')
      catSetState('happy', true)
      clearTimeout(_catHappyTimer)
      _catHappyTimer = setTimeout(() => catSetState('neutral', false), 4000)
      if (currentTab === 'planner') pagePlanner()
      return
    }
    updateFocusTimer()
  }, 1000)
}

function renderFocusOverlay() {
  removeFocusOverlay()
  const f = _S.focus
  const size = 200, stroke = 10, r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r
  const off = circ * (1 - (f.total - f.left) / f.total)
  const el = document.createElement('div')
  el.id = 'focus-lock-overlay'
  el.innerHTML = `
    <p style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px">🔒 Focus Mode</p>
    <div class="focus-ring-wrap">
      <svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pl)" stroke-width="${stroke}"/>
        <circle id="fl-arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pd)" stroke-width="${stroke}" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" stroke-linecap="round" style="transition:stroke-dashoffset .8s ease;transform:rotate(-90deg);transform-origin:center"/>
      </svg>
      <div class="focus-ring-label">
        <span id="fl-time" style="font-size:40px;font-weight:900;color:var(--text);font-variant-numeric:tabular-nums">${fmtTime(f.left)}</span>
        <span style="font-size:11px;font-weight:800;color:var(--pa);text-transform:uppercase;letter-spacing:1px">Remaining</span>
      </div>
    </div>
    <div class="focus-task-name">${esc(f.taskName)}</div>
    <div style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:20px">Stay locked in. You got this 💪</div>
    <div style="display:flex;gap:14px;margin-bottom:28px">
      <button onclick="window.pauseResumeFocus()" id="fl-pause" style="width:60px;height:60px;border-radius:18px;font-size:22px;background:linear-gradient(135deg,var(--pl),var(--pd));border:2px solid var(--p);box-shadow:var(--sh-3);transition:all var(--t-base);animation:focusPulse 2s infinite">⏸</button>
    </div>
    <button onclick="window.attemptExitFocus()" class="focus-exit-btn">Exit Early</button>
    <p style="font-size:11px;color:var(--muted);font-weight:600;margin-top:10px;text-align:center">Nav is locked until session ends</p>`
  document.body.appendChild(el)
}

function updateFocusTimer() {
  const f = _S.focus
  const el = document.getElementById('fl-time')
  const arc = document.getElementById('fl-arc')
  if (el) el.textContent = fmtTime(f.left)
  if (arc) {
    const size = 200, stroke = 10, r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r
    arc.style.strokeDashoffset = circ * (1 - (f.total - f.left) / f.total)
  }
}

export function pauseResumeFocus() {
  _S.focus.running = !_S.focus.running
  if (_S.focus.running) {
    clearInterval(focusTimer)
    focusTimer = setInterval(() => {
      _S.focus.left--
      if (_S.focus.left <= 0) {
        clearInterval(focusTimer); _S.focus.running = false; _S.focus.active = false
        document.getElementById('nav').classList.remove('locked')
        removeFocusOverlay()
        _S.tasks = _S.tasks.map((t) => t.id === _S.focus.taskId ? { ...t, done: true } : t)
        saveState(_S)
        showToast(`✅ "${esc(_S.focus.taskName)}" complete! Great session 🎉`, 'var(--pl)', 'var(--pa)')
        if (currentTab === 'planner') pagePlanner()
        return
      }
      updateFocusTimer()
    }, 1000)
  } else {
    clearInterval(focusTimer)
  }
  const btn = document.getElementById('fl-pause')
  if (btn) btn.textContent = _S.focus.running ? '⏸' : '▶'
}

export function attemptExitFocus() {
  const warn = document.createElement('div')
  warn.id = 'focus-warn'
  warn.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(50,40,80,.5);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)'
  warn.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:24px 20px;max-width:320px;text-align:center;box-shadow:var(--sh-3)">
      <p style="font-size:28px;margin-bottom:10px">⚠️</p>
      <p style="font-weight:900;font-size:16px;margin-bottom:8px">Exit Focus?</p>
      <p style="font-size:13px;color:var(--muted);font-weight:600;margin-bottom:20px;line-height:1.5">Leaving early marks this session as incomplete and logs wasted time.</p>
      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('focus-warn').remove()" style="flex:1;padding:11px;border-radius:12px;background:var(--pl);border:1.5px solid var(--p);font-weight:800;font-size:13px;cursor:pointer">Stay 💪</button>
        <button onclick="window.exitFocusEarly()" style="flex:1;padding:11px;border-radius:12px;background:#f8c8c8;border:1.5px solid #f0a0a0;font-weight:800;font-size:13px;color:#c84040;cursor:pointer">Exit</button>
      </div>
    </div>`
  document.body.appendChild(warn)
}

export function exitFocusEarly() {
  clearInterval(focusTimer)
  const wastedMins = Math.round((_S.focus.total - _S.focus.left) / 60)
  if (wastedMins > 0) {
    const leaks = { ..._S.leaks }
    leaks[today()] = [...(leaks[today()] || []), { label: 'Abandoned: ' + _S.focus.taskName, mins: wastedMins, id: uid() }]
    _S.leaks = leaks
    saveState(_S)
  }
  _S.focus.active = false
  _S.focus.running = false
  document.getElementById('nav').classList.remove('locked')
  ;['focus-lock-overlay', 'focus-warn'].forEach((id) => { const e = document.getElementById(id); if (e) e.remove() })
  showToast('Session exited early. Stay consistent next time 🌱', '#f8e8b8', '#c87820')
  catSetState('idle', true)
  clearTimeout(_catHappyTimer)
  _catHappyTimer = setTimeout(() => catSetState('neutral', false), 3000)
  if (currentTab === 'planner') pagePlanner()
}

function removeFocusOverlay() {
  const el = document.getElementById('focus-lock-overlay')
  if (el) el.remove()
}

/* ── Setup ── */
export function showSetup() {
  document.getElementById('nav').style.display = 'none'
  document.getElementById('page').style.padding = '0'
  document.getElementById('page').innerHTML = `
  <div id="setup">
    <div class="setup-card">
      <h1 style="font-family:'Playfair Display',serif;font-size:28px;text-align:center;margin-bottom:4px">Welcome! ✨</h1>
      <p style="text-align:center;color:var(--muted);font-size:13px;margin-bottom:24px">Let's set up your space</p>
      <div class="label">Pick your vibe</div>
      <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px">
        ${renderAvatarGrid('savi', 'setupAvatar', '🌸')}
      </div>
      <input class="inp" id="setup-name" placeholder="Your name *" oninput="window.checkSetup()"/>
      <input class="inp" id="setup-bio" placeholder="Short bio (optional)"/>
      <input class="inp" id="setup-goal" placeholder="Your main goal e.g. Study in Japan 🇯🇵" style="margin-bottom:20px"/>
      <button class="btn-primary" id="setup-btn" onclick="window.doSetup()" disabled style="background:linear-gradient(135deg,var(--pd),var(--pa));opacity:.5">Let's Go! 🚀</button>
    </div>
  </div>`
  UI.set('setupAvatar', '🌸')
}

export function checkSetup() {
  const name = document.getElementById('setup-name').value.trim()
  const btn = document.getElementById('setup-btn')
  btn.disabled = !name
  btn.style.opacity = name ? '1' : '.5'
}

export function doSetup() {
  const name = document.getElementById('setup-name').value.trim()
  if (!name) return
  saveProfile({ name, bio: document.getElementById('setup-bio').value, goal: document.getElementById('setup-goal').value, avatar: UI.get('setupAvatar', '🌸'), joined: today() })
  document.getElementById('nav').style.display = 'flex'
  document.getElementById('page').style.padding = '0 16px 96px'
  switchTab('home')
}

/* ── Tab Routing ── */
export function switchTab(tabName) {
  currentTab = tabName
  cleanAndCarryForwardTasks()
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName)
  })
  const pages = { home: pageHome, habits: pageHabits, planner: pagePlanner, timer: pageTimer, stats: pageStats, settings: pageSettings }
  if (pages[tabName]) pages[tabName]()
  if (tabName === 'timer') catSetState('focus', false)
  else if (tabName === 'home') catSetState('neutral', false)
  else if (tabName === 'stats') catSetState('idle', false)
  else catSetState('neutral', false)
}

/* ── Task Cleanup ── */
function cleanAndCarryForwardTasks() {
  const td = today()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const ydStr = yesterday.toISOString().split('T')[0]
  const yTasks = _S.tasks.filter((t) => t.date === ydStr && !t.done)
  const alreadyCarried = new Set(_S.tasks.filter((t) => t.date === td && t.carriedFrom).map((t) => t.carriedFrom))
  const newCarried = yTasks.filter((t) => !alreadyCarried.has(t.id)).map((t) => ({ ...t, id: uid(), date: td, done: false, carriedFrom: t.id }))
  const cleaned = _S.tasks.filter((t) => t.date >= cutoffStr)
  const updated = [...cleaned, ...newCarried]
  if (updated.length !== _S.tasks.length || newCarried.length > 0) {
    _S.tasks = updated
    saveState(_S)
  }
}

/* ── Select In Grid ── */
export function selectInGrid(containerId, stateKey, value) {
  UI.set(stateKey, value)
  document.querySelectorAll(`[id^="${containerId}-"]`).forEach((btn) => {
    const isSelected = btn.id === `${containerId}-${value}`
    btn.style.background = isSelected ? 'var(--p)' : 'var(--pl)'
    btn.style.borderColor = isSelected ? 'var(--pd)' : 'transparent'
  })
}

/* ── QTPrio ── */
export function selectQTPrio(p) {
  UI.set('taskPrio', p)
  ;['High', 'Medium', 'Low'].forEach((x) => {
    const b = document.getElementById('qprio-' + x)
    if (!b) return
    b.style.background = x === p ? PRIO_COLS[x][0] : 'var(--pl)'
    b.style.color = x === p ? PRIO_COLS[x][1] : 'var(--muted)'
    b.style.borderColor = x === p ? PRIO_COLS[x][1] : 'var(--p)'
  })
}

/* ── Cat Companion ── */
function catSetState(state, showBubble = true) {
  if (_reduceMotion && state === _catState) return
  const cfg = CAT_STATES[state] || CAT_STATES.neutral
  const frame = document.getElementById('cat-frame')
  if (!frame) return
  frame.querySelectorAll('svg').forEach((svg) => svg.classList.remove('cat-active'))
  const activeSvg = document.getElementById('cat-img-' + cfg.img)
  if (activeSvg) activeSvg.classList.add('cat-active')
  frame.className = 'cat-frame ' + cfg.cls
  _catState = state
  if (showBubble) catShowBubble(state)
}

function catShowBubble(state) {
  const cfg = CAT_STATES[state || _catState] || CAT_STATES.neutral
  const bubble = document.getElementById('cat-bubble')
  if (!bubble) return
  clearTimeout(_catBubbleTimer)
  const msg = cfg.bubbles[Math.floor(Math.random() * cfg.bubbles.length)]
  bubble.textContent = msg
  bubble.style.display = 'block'
  bubble.style.animation = 'none'
  void bubble.offsetWidth
  bubble.style.animation = ''
  _catBubbleTimer = setTimeout(() => { bubble.style.display = 'none' }, 2800)
}

function catShowToggleMenu() {
  haptic('medium')
  const visBg = _catVisible ? '#fff5f5' : 'var(--pl)'
  const visBdr = _catVisible ? '#f8c8c8' : 'var(--p)'
  const visColor = _catVisible ? '#c84040' : 'var(--pa)'
  const visLabel = _catVisible ? '🙈  Hide Cat' : '😸  Show Cat'
  const motBg = _reduceMotion ? 'var(--pl)' : '#fff'
  const motBdr = _reduceMotion ? 'var(--pd)' : 'var(--p)'
  const motLabel = _reduceMotion ? '✨  Animations On' : '🍃  Reduce Motion'
  const catEmoji = _catState === 'happy' ? '😸' : _catState === 'focus' ? '🤓' : _catState === 'idle' ? '😴' : '🐱'
  showModal('🐱 Cat Companion',
    '<p style="font-size:var(--text-sm);color:var(--muted);font-weight:600;margin-bottom:18px;line-height:1.5">Your little study buddy! Tap for encouragement.</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px">' +
      `<button onclick="window.catToggleVisible()" style="padding:13px 16px;border-radius:var(--r-md);background:${visBg};border:1.5px solid ${visBdr};font-weight:800;font-size:var(--text-sm);color:${visColor};text-align:left;cursor:pointer">${visLabel}</button>` +
      `<button onclick="window.catToggleMotion()" style="padding:13px 16px;border-radius:var(--r-md);background:${motBg};border:1.5px solid ${motBdr};font-weight:800;font-size:var(--text-sm);color:var(--text);text-align:left;cursor:pointer">${motLabel}</button>` +
    '</div>' +
    `<div style="margin-top:20px;text-align:center"><div style="font-size:64px">${catEmoji}</div><p style="font-size:var(--text-xs);color:var(--muted);font-weight:700;margin-top:6px">Currently: ${_catState} mode</p></div>`
  )
}

export function catToggleVisible() {
  _catVisible = !_catVisible
  try { localStorage.setItem('hb_cat_visible', JSON.stringify(_catVisible)) } catch { /* localStorage unavailable */ }
  const el = document.getElementById('cat-companion')
  if (el) el.classList.toggle('hidden', !_catVisible)
  closeModal()
  showToast(_catVisible ? '😸 Cat is back!' : '🙈 Cat hidden (long-press to bring back)', 'var(--pl)', 'var(--pa)')
}

export function catToggleMotion() {
  _reduceMotion = !_reduceMotion
  closeModal()
  catShowToggleMenu()
}

/* ── Utils ── */
function fmtTime(secs) {
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

/* ── Export for inline onclick handlers ── */
// All UI functions are already exported; app.js will attach them to window

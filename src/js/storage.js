const STORE_KEY = 'hb_v2'
const DB_NAME = 'HabitBloomDB'
const DB_VERSION = 1

let _saveTimer = null
let _db = null

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) { resolve(_db); return }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state', { keyPath: 'key' })
      }
    }
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db) }
    req.onerror = () => reject(req.error)
  })
}

async function dbGet(key) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('state', 'readonly')
      const req = tx.objectStore('state').get(key)
      req.onsuccess = () => resolve(req.result ? req.result.value : null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function dbSet(key, value) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('state', 'readwrite')
      tx.objectStore('state').put({ key, value })
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

function lsGet(key, def) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : def
  } catch {
    return def
  }
}

function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* localStorage unavailable */ }
}

export async function loadState(defaults) {
  let data = await dbGet(STORE_KEY)
  if (!data) {
    data = lsGet(STORE_KEY, null)
  }
  if (!data) {
    const migrated = migrateOldKeys()
    data = migrated || {}
  }
  return { ...defaults, ...data, earnedBadges: data.earnedBadges || [] }
}

function migrateOldKeys() {
  const old = {
    profile: lsGet('hb_profile', null),
    habits: lsGet('hb_habits', null),
    logs: lsGet('hb_logs', null),
    moods: lsGet('hb_moods', null),
    journal: lsGet('hb_journal', null),
    tasks: lsGet('hb_tasks', null),
    theme: lsGet('hb_theme', null),
    pom: lsGet('hb_pom', null),
    audits: lsGet('hb_audits', null),
    leaks: lsGet('hb_leaks', null),
    energy: lsGet('hb_energy', null),
    rcData: lsGet('hb_rcdata', null),
    earnedBadges: lsGet('hb_earned_badges', []),
  }
  return Object.values(old).some((v) => v !== null) ? old : null
}

export function saveState(S) {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(async () => {
    const ok = await dbSet(STORE_KEY, S)
    if (!ok) lsSet(STORE_KEY, S)
    _saveTimer = null
  }, 150)
}

export function exportData(S) {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `habitbloom-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

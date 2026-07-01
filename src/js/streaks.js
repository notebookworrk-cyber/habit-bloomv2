import { saveState } from './storage.js'
import { today } from './habits.js'

let _S = null
let _streakCache = null
let _streakCacheDate = null

export function initStateRef(S) {
  _S = S
}

export function invalidateStreakCache() {
  _streakCache = null
  _streakCacheDate = null
}

export function getAllStreaks() {
  const todayStr = today()
  if (_streakCache && _streakCacheDate === todayStr) return _streakCache

  const cache = {}
  _S.habits.forEach((habit) => {
    let streakCount = 0
    const baseDate = new Date()
    for (let daysBack = 0; daysBack < 365; daysBack++) {
      const checkDate = new Date(baseDate)
      checkDate.setDate(baseDate.getDate() - daysBack)
      const dateKey = checkDate.toISOString().split('T')[0]
      if (_S.logs[dateKey]?.[habit.id]?.done) streakCount++
      else break
    }
    cache[habit.id] = streakCount
  })

  _streakCache = cache
  _streakCacheDate = todayStr
  return cache
}

export function getBestStreak() {
  const streaks = getAllStreaks()
  return _S.habits.length ? Math.max(0, ...Object.values(streaks)) : 0
}

export function getCurrentStreak(habitId) {
  return getAllStreaks()[habitId] || 0
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function sendNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/favicon.svg' })
}

/* ── Mood / Journal / Energy helpers ── */

export function saveMood(val) {
  const td = today()
  const cur = _S.moods[td] || {}
  _S.moods = { ..._S.moods, [td]: { ...cur, val } }
  saveState(_S)
}

export function saveJournal(text) {
  _S.journal = { ..._S.journal, [today()]: text }
  saveState(_S)
}

export function setEnergy(val) {
  _S.energy = { ..._S.energy, [today()]: val }
  saveState(_S)
}

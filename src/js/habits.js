import { saveState } from './storage.js'

const ICONS = ['⭐', '📚', '🏃', '✨', '📖', '💛', '🌙', '🎵', '🧘', '💧', '🎨', '🧠', '💊', '🛁', '🌿', '🎮', '🍎', '🏋️', '🧩', '📝']

export const DEFAULT_HABITS = [
  { id: 'h1', name: 'Study', icon: '📚', target: 2, unit: 'hrs' },
  { id: 'h2', name: 'Workout', icon: '🏃', target: 1, unit: 'session' },
  { id: 'h3', name: 'Skincare', icon: '✨', target: 1, unit: 'routine' },
  { id: 'h4', name: 'Reading', icon: '📖', target: 30, unit: 'min' },
  { id: 'h5', name: 'Chill time', icon: '💛', target: 1, unit: 'session' },
  { id: 'h6', name: 'Sleep', icon: '🌙', target: 8, unit: 'hrs' },
]

let _S = null

export function initStateRef(S) {
  _S = S
}

export function getIcons() {
  return [...ICONS]
}

export function addHabit(habit) {
  _S.habits = [..._S.habits, { id: uid(), ...habit }]
  saveState(_S)
  return _S.habits
}

export function updateHabit(habitId, data) {
  _S.habits = _S.habits.map((h) => (h.id === habitId ? { ...h, ...data } : h))
  saveState(_S)
  return _S.habits
}

export function deleteHabit(habitId) {
  _S.habits = _S.habits.filter((h) => h.id !== habitId)
  saveState(_S)
  return _S.habits
}

export function toggleHabit(habitId) {
  const td = today()
  const dayLog = { ...(_S.logs[td] || {}) }
  const isDone = !dayLog[habitId]?.done
  dayLog[habitId] = { ...(dayLog[habitId] || {}), done: isDone }
  _S.logs = { ..._S.logs, [td]: dayLog }
  saveState(_S)
  return isDone
}

export function getHabitById(habitId) {
  return _S.habits.find((h) => h.id === habitId)
}

export function getAllHabits() {
  return _S.habits
}

export function setHabits(habits) {
  _S.habits = habits
  saveState(_S)
}

export function getTodayLog() {
  return _S.logs[today()] || {}
}

export function getLogs() {
  return _S.logs
}

export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function weekDates() {
  const base = new Date()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en', { weekday: 'short' })
}

export function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function haptic(type = 'light') {
  if (!navigator.vibrate) return
  const patterns = { light: [6], medium: [12], success: [8, 40, 8] }
  navigator.vibrate(patterns[type] || [6])
}

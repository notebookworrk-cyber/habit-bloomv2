import { getAllStreaks } from './streaks.js'
import { weekDates, dayLabel } from './habits.js'

let _S = null
let _statsCache = null

export function initStateRef(S) {
  _S = S
}

export function invalidateStatsCache() {
  _statsCache = null
}

export function getStats() {
  if (_statsCache) return _statsCache

  const streaks = getAllStreaks()
  const total = Object.values(_S.logs)
    .flatMap((dayLog) => Object.values(dayLog))
    .filter((entry) => entry.done).length
  const maxStreak = _S.habits.length ? Math.max(0, ...Object.values(streaks)) : 0
  const moodDays = Object.keys(_S.moods).length

  _statsCache = { total, maxStreak, moodDays, streaks }
  return _statsCache
}

export function todayPct() {
  if (!_S.habits.length) return 0
  const td = new Date().toISOString().split('T')[0]
  const todayLog = _S.logs[td] || {}
  const doneCount = _S.habits.filter((h) => todayLog[h.id]?.done).length
  return Math.round((doneCount / _S.habits.length) * 100)
}

export function getWeeklyChartData() {
  const days = weekDates()
  return days.map((d) => {
    const dayLog = _S.logs[d] || {}
    const done = _S.habits.filter((h) => dayLog[h.id]?.done).length
    const pct = _S.habits.length ? Math.round((done / _S.habits.length) * 100) : 0
    return { d, label: dayLabel(d), done, pct }
  })
}

export function getMonthlyChartData(month, year) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const data = []
  for (let i = 1; i <= daysInMonth; i++) {
    const d = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dayLog = _S.logs[d] || {}
    const done = _S.habits.filter((h) => dayLog[h.id]?.done).length
    const pct = _S.habits.length ? Math.round((done / _S.habits.length) * 100) : 0
    data.push({ d, day: i, done, pct })
  }
  return data
}

export function getCompletionRate() {
  const total = Object.values(_S.logs)
    .flatMap((dayLog) => Object.values(dayLog))
    .filter((entry) => entry.done).length
  const totalDays = Object.keys(_S.logs).length || 1
  return Math.round((total / (totalDays * _S.habits.length || 1)) * 100)
}

export function getHabitConsistency() {
  const totalDays = Object.keys(_S.logs).length || 1
  return _S.habits.map((habit) => {
    const totalDone = Object.values(_S.logs).filter((d) => d[habit.id]?.done).length
    return { ...habit, rate: Math.round((totalDone / totalDays) * 100) }
  })
}

export function getWeeklyInsight() {
  const days = weekDates()
  if (!_S.habits.length) return 'Add habits to start tracking 🌱'
  const habitRates = _S.habits.map((h) => {
    const done = days.filter((d) => _S.logs[d]?.[h.id]?.done).length
    return { name: h.name, icon: h.icon, rate: Math.round((done / 7) * 100) }
  })
  const best = habitRates.reduce((a, b) => (b.rate > a.rate ? b : a), habitRates[0])
  const worst = habitRates.reduce((a, b) => (b.rate < a.rate ? b : a), habitRates[0])
  const avg = Math.round(habitRates.reduce((s, h) => s + h.rate, 0) / habitRates.length)
  const leakW = days.reduce((s, d) => s + (_S.leaks[d] || []).reduce((a, l) => a + l.mins, 0), 0)
  if (avg >= 80) return `🏆 Incredible week! ${avg}% consistency. ${best.icon} ${best.name} is your strongest habit`
  if (avg >= 50) return `💪 Solid at ${avg}%. ${worst.icon} ${worst.name} needs more attention — try tomorrow`
  if (leakW > 120) return `⏳ ${leakW}min lost to distractions this week. Cut that in half and watch the difference`
  return `🌱 ${avg}% this week. Focus on just ${worst.icon} ${worst.name} — build momentum from there`
}

export function getMoodData() {
  const days = weekDates()
  return days.map((d) => ({ label: dayLabel(d), val: _S.moods[d]?.val || 0 }))
}

export function getEnergyData() {
  const days = weekDates()
  return days.map((d) => ({ label: dayLabel(d), val: _S.energy[d] || 0 }))
}

export function getLeakData() {
  const days = weekDates()
  return days.map((d) => ({
    label: dayLabel(d),
    mins: (_S.leaks[d] || []).reduce((s, l) => s + l.mins, 0),
  }))
}

export function getRealityDataForDays(days) {
  return days.map((d) => {
    const dayTasks = _S.tasks.filter((t) => t.date === d)
    const planned = dayTasks.filter((t) => t.time || t.plannedMins).length
    const completed = dayTasks.filter((t) => t.done).length
    const pct = planned ? Math.round((completed / planned) * 100) : 0
    return { d, label: dayLabel(d), planned, completed, pct }
  })
}

export function getRealityData() {
  return getRealityDataForDays(weekDates())
}

export function getRCInsight() {
  const data = getRealityData()
  const withPlans = data.filter((d) => d.planned > 0)
  if (!withPlans.length) return 'Start adding tasks to track your reality gap! 📋'
  const avg = withPlans.reduce((s, d) => s + d.pct, 0) / withPlans.length
  if (avg >= 85) return `Crushing it — ${Math.round(avg)}% completion this week! 🎯`
  if (avg >= 60) return `Good progress! ${Math.round(avg)}% completion. A few gaps to close 📈`
  if (avg >= 30) return `${Math.round(avg)}% done. Try setting smaller, achievable goals 🌱`
  return `Only ${Math.round(avg)}% complete. Be honest: are your plans realistic? 🤔`
}

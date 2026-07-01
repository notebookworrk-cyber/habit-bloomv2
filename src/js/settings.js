import { saveState, exportData, importData } from './storage.js'
import { DEFAULT_HABITS, setHabits } from './habits.js'
import { invalidateStreakCache } from './streaks.js'
import { invalidateStatsCache } from './stats.js'

const THEMES = {
  lav: { name: 'Lavender', p: '#d4c8f8', pl: '#f0ecff', pd: '#a98be8', pa: '#7c5cbf', nav: '#f0ecff' },
  sky: { name: 'Sky', p: '#b8d8f8', pl: '#e8f4ff', pd: '#7bbaf0', pa: '#3a8ad4', nav: '#e8f4ff' },
  peach: { name: 'Peach', p: '#f8d4b8', pl: '#fff3ec', pd: '#f0a878', pa: '#d07030', nav: '#fff3ec' },
  mint: { name: 'Mint', p: '#b8f0d8', pl: '#e8fff4', pd: '#58c890', pa: '#1ea86a', nav: '#e8fff4' },
  rose: { name: 'Rose', p: '#f8c8d4', pl: '#fff0f3', pd: '#e888a0', pa: '#c84070', nav: '#fff0f3' },
}

let _S = null

export function initStateRef(S) {
  _S = S
}

export function getThemes() {
  return THEMES
}

export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.lav
  const rootStyle = document.documentElement.style
  rootStyle.setProperty('--p', theme.p)
  rootStyle.setProperty('--pl', theme.pl)
  rootStyle.setProperty('--pd', theme.pd)
  rootStyle.setProperty('--pa', theme.pa)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = theme.nav
}

export function changeTheme(themeId) {
  _S.theme = themeId
  applyTheme(themeId)
  saveState(_S)
}

export function getDarkMode() {
  return _S.darkMode || false
}

export function toggleDarkMode() {
  _S.darkMode = !_S.darkMode
  document.documentElement.setAttribute('data-theme', _S.darkMode ? 'dark' : '')
  saveState(_S)
  return _S.darkMode
}

export function applyDarkMode() {
  if (_S.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function resetHabits() {
  setHabits(DEFAULT_HABITS.map((h) => ({ ...h, id: Math.random().toString(36).slice(2, 9) })))
  invalidateStreakCache()
  invalidateStatsCache()
}

export function saveProfile(profile) {
  _S.profile = profile
  saveState(_S)
}

export function doExport() {
  exportData(_S)
}

export async function doImport(file, callback) {
  try {
    const data = await importData(file)
    Object.assign(_S, data)
    saveState(_S)
    applyDarkMode()
    applyTheme(_S.theme || 'lav')
    invalidateStreakCache()
    invalidateStatsCache()
    if (callback) callback()
  } catch (e) {
    alert('Import failed: ' + e.message)
  }
}

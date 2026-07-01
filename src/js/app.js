import { loadState } from './storage.js'
import { initStateRef as initHabitsRef, DEFAULT_HABITS } from './habits.js'
import { initStateRef as initStreaksRef, requestNotificationPermission } from './streaks.js'
import { initStateRef as initStatsRef } from './stats.js'
import { initStateRef as initSettingsRef, applyTheme, applyDarkMode } from './settings.js'
import {
  init as initUI, showToast,
  switchTab, toggleHabitUI, saveHabit, deleteHabitUI, openAddHabit, openEditHabit,
  openMoodModal, saveMoodUI, openJournalModal, saveJournalUI,
  openEnergyPicker, setEnergyUI, openLeakLogger, selectLeakPreset, saveLeakEntry, removeLeak,
  openAudit, closeAudit, auditStep, saveAuditUI, openAuditHistory,
  openAddTask, saveTask, openQuickAddTask, saveQuickTask, selectTaskPrio, selectQTPrio,
  toggleTask, deleteTask, openFocusPicker, selectFocusMins, launchFocus,
  pauseResumeFocus, attemptExitFocus, exitFocusEarly,
  pomToggle, pomReset, pomSkip, pomSetWork, pomSetBrk, _patchTimerDOM,
  changeThemeUI, toggleDarkModeUI, resetHabitsUI, doExportUI, doImportUI,
  openEditProfile, saveProfileUI, selectInGrid,
  showSetup, checkSetup, doSetup,
  catToggleVisible, catToggleMotion,
} from './ui.js'

const DEFAULT_STATE = {
  profile: null,
  habits: DEFAULT_HABITS.map((h) => ({ ...h, id: Math.random().toString(36).slice(2, 9) })),
  logs: {},
  moods: {},
  journal: {},
  tasks: [],
  theme: 'lav',
  darkMode: false,
  pom: { work: 25, brk: 5, left: 1500, phase: 'work', running: false, sessions: 0 },
  audits: {},
  leaks: {},
  energy: {},
  rcData: {},
  focus: { active: false },
  earnedBadges: [],
}

document.addEventListener('DOMContentLoaded', async () => {
  const S = await loadState(DEFAULT_STATE)
  _S = S

  initHabitsRef(S)
  initStreaksRef(S)
  initStatsRef(S)
  initSettingsRef(S)
  initUI(S)

  applyTheme(S.theme || 'lav')
  applyDarkMode()

  requestNotificationPermission()

  wireNav()
  wirePageLoad()

  const uiFns = {
    toggleHabitUI, saveHabit, deleteHabitUI, openAddHabit, openEditHabit,
    openMoodModal, saveMoodUI, openJournalModal, saveJournalUI,
    openEnergyPicker, setEnergyUI, openLeakLogger, selectLeakPreset, saveLeakEntry, removeLeak,
    openAudit, closeAudit, auditStep, saveAuditUI, openAuditHistory,
    openAddTask, saveTask, openQuickAddTask, saveQuickTask, selectTaskPrio, selectQTPrio,
    toggleTask, deleteTask, openFocusPicker, selectFocusMins, launchFocus,
    pauseResumeFocus, attemptExitFocus, exitFocusEarly,
    pomToggle, pomReset, pomSkip, pomSetWork, pomSetBrk, _patchTimerDOM,
    changeThemeUI, toggleDarkModeUI, resetHabitsUI, doExportUI, doImportUI,
    openEditProfile, saveProfileUI, selectInGrid,
    showSetup, checkSetup, doSetup,
    catToggleVisible, catToggleMotion,
    switchTab,
  }
  Object.assign(window, uiFns)

  if (!S.profile) {
    showSetup()
  } else {
    switchTab('home')
  }
})

function wireNav() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab
      if (!tab) return
      if (_S?.focus?.active) {
        showToast('Complete or exit focus session first 🔒', '#fff3ec', '#c87820')
        return
      }
      switchTab(tab)
    })
  })
}

function wirePageLoad() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
  if (navigator.connection) {
    navigator.connection.addEventListener('change', () => {
      if (navigator.onLine) {
        const toast = document.getElementById('offline-toast')
        if (toast) toast.remove()
      }
    })
  }
}

let _S = null

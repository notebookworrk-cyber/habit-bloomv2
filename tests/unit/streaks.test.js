import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/js/storage.js', () => ({
  saveState: vi.fn(),
}))

describe('streaks module', () => {
  let streaks
  let S

  function addDays(dateStr, days) {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  beforeEach(async () => {
    vi.resetModules()
    const todayStr = '2025-01-15'
    vi.setSystemTime(new Date(todayStr))

    const habitsMod = await import('../../src/js/habits.js')
    S = {
      habits: [
        { id: 'h1', name: 'Study', icon: '📚', target: 2, unit: 'hrs' },
        { id: 'h2', name: 'Workout', icon: '🏃', target: 1, unit: 'session' },
      ],
      logs: {},
      moods: {},
      journal: {},
      energy: {},
    }
    streaks = await import('../../src/js/streaks.js')
    streaks.initStateRef(S)
  })

  describe('getAllStreaks', () => {
    it('returns zero streaks when no habits are done', () => {
      const result = streaks.getAllStreaks()
      expect(result.h1).toBe(0)
      expect(result.h2).toBe(0)
    })

    it('counts consecutive days', () => {
      const today = '2025-01-15'
      for (let i = 0; i < 3; i++) {
        const d = addDays(today, -i)
        S.logs[d] = { h1: { done: true }, h2: { done: true } }
      }
      const result = streaks.getAllStreaks()
      expect(result.h1).toBe(3)
      expect(result.h2).toBe(3)
    })

    it('stops at first missed day', () => {
      const today = '2025-01-15'
      S.logs['2025-01-15'] = { h1: { done: true } }
      S.logs['2025-01-14'] = { h1: { done: true } }
      S.logs['2025-01-12'] = { h1: { done: true } }
      const result = streaks.getAllStreaks()
      expect(result.h1).toBe(2)
    })
  })

  describe('getBestStreak', () => {
    it('returns 0 when no habits', () => {
      S.habits = []
      expect(streaks.getBestStreak()).toBe(0)
    })

    it('returns max streak across habits', () => {
      const today = '2025-01-15'
      for (let i = 0; i < 5; i++) S.logs[addDays(today, -i)] = { h1: { done: true } }
      for (let i = 0; i < 3; i++) S.logs[addDays(today, -i)] = { ...S.logs[addDays(today, -i)], h2: { done: true } }
      expect(streaks.getBestStreak()).toBe(5)
    })
  })

  describe('getCurrentStreak', () => {
    it('returns streak for a specific habit', () => {
      const today = '2025-01-15'
      for (let i = 0; i < 4; i++) S.logs[addDays(today, -i)] = { h1: { done: true } }
      expect(streaks.getCurrentStreak('h1')).toBe(4)
      expect(streaks.getCurrentStreak('h2')).toBe(0)
    })
  })

  describe('saveMood', () => {
    it('saves mood for today', () => {
      streaks.saveMood(4)
      expect(S.moods['2025-01-15'].val).toBe(4)
    })
  })

  describe('saveJournal', () => {
    it('saves journal entry for today', () => {
      streaks.saveJournal('A great day')
      expect(S.journal['2025-01-15']).toBe('A great day')
    })
  })

  describe('setEnergy', () => {
    it('sets energy level for today', () => {
      streaks.setEnergy(3)
      expect(S.energy['2025-01-15']).toBe(3)
    })
  })

  describe('cache invalidation', () => {
    it('invalidates streak cache', () => {
      const today = '2025-01-15'
      S.logs[today] = { h1: { done: true } }
      streaks.getAllStreaks()
      streaks.invalidateStreakCache()
      S.logs[today] = { h1: { done: true }, h2: { done: true } }
      const result = streaks.getAllStreaks()
      expect(result.h2).toBe(1)
    })
  })
})

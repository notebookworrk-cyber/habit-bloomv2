import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/js/storage.js', () => ({
  saveState: vi.fn(),
}))

describe('habits module', () => {
  let habits
  let S

  beforeEach(async () => {
    vi.resetModules()
    S = {
      habits: [],
      logs: {},
      profile: null,
    }
    habits = await import('../../src/js/habits.js')
    habits.initStateRef(S)
  })

  describe('addHabit', () => {
    it('adds a habit with generated id', () => {
      const result = habits.addHabit({ name: 'Test', icon: '⭐', target: 1, unit: 'session' })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test')
      expect(result[0].id).toBeDefined()
    })
  })

  describe('updateHabit', () => {
    it('updates an existing habit', () => {
      habits.addHabit({ name: 'Original', icon: '⭐', target: 1, unit: 'session' })
      const id = S.habits[0].id
      habits.updateHabit(id, { name: 'Updated' })
      expect(S.habits[0].name).toBe('Updated')
    })
  })

  describe('deleteHabit', () => {
    it('removes a habit by id', () => {
      habits.addHabit({ name: 'Test', icon: '⭐', target: 1, unit: 'session' })
      const id = S.habits[0].id
      habits.deleteHabit(id)
      expect(S.habits).toHaveLength(0)
    })
  })

  describe('toggleHabit', () => {
    it('toggles a habit as done for today', () => {
      habits.addHabit({ name: 'Test', icon: '⭐', target: 1, unit: 'session' })
      const id = S.habits[0].id
      const result = habits.toggleHabit(id)
      expect(result).toBe(true)
      const td = new Date().toISOString().split('T')[0]
      expect(S.logs[td][id].done).toBe(true)
    })

    it('toggles back to not done', () => {
      habits.addHabit({ name: 'Test', icon: '⭐', target: 1, unit: 'session' })
      const id = S.habits[0].id
      habits.toggleHabit(id)
      const result = habits.toggleHabit(id)
      expect(result).toBe(false)
    })
  })

  describe('getHabitById', () => {
    it('returns the correct habit', () => {
      habits.addHabit({ name: 'Alpha', icon: '⭐', target: 1, unit: 'session' })
      const id = S.habits[0].id
      habits.addHabit({ name: 'Beta', icon: '📚', target: 2, unit: 'hrs' })
      const found = habits.getHabitById(id)
      expect(found.name).toBe('Alpha')
    })

    it('returns undefined for missing habit', () => {
      expect(habits.getHabitById('nonexistent')).toBeUndefined()
    })
  })

  describe('getAllHabits', () => {
    it('returns all habits', () => {
      habits.addHabit({ name: 'A', icon: '⭐', target: 1, unit: 'session' })
      habits.addHabit({ name: 'B', icon: '📚', target: 2, unit: 'hrs' })
      expect(habits.getAllHabits()).toHaveLength(2)
    })
  })

  describe('today', () => {
    it('returns today as YYYY-MM-DD', () => {
      const d = habits.today()
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('weekDates', () => {
    it('returns 7 date strings', () => {
      const dates = habits.weekDates()
      expect(dates).toHaveLength(7)
      dates.forEach((d) => expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/))
    })
  })

  describe('dayLabel', () => {
    it('returns short weekday label', () => {
      const label = habits.dayLabel('2025-01-06')
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })
  })

  describe('esc', () => {
    it('escapes HTML special characters', () => {
      expect(habits.esc('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('returns empty string for null/undefined', () => {
      expect(habits.esc(null)).toBe('')
      expect(habits.esc(undefined)).toBe('')
    })
  })

  describe('uid', () => {
    it('generates unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => habits.uid()))
      expect(ids.size).toBe(100)
    })
  })

  describe('DEFAULT_HABITS', () => {
    it('has 6 default habits', () => {
      expect(habits.DEFAULT_HABITS).toHaveLength(6)
    })
  })

  describe('getIcons', () => {
    it('returns list of icon strings', () => {
      const icons = habits.getIcons()
      expect(icons.length).toBeGreaterThan(0)
      expect(icons[0]).toBe('⭐')
    })
  })

  describe('setHabits', () => {
    it('replaces all habits', () => {
      habits.setHabits([{ id: 'x1', name: 'Replaced' }])
      expect(S.habits).toHaveLength(1)
      expect(S.habits[0].name).toBe('Replaced')
    })
  })

  describe('getTodayLog', () => {
    it('returns empty object if no log for today', () => {
      expect(habits.getTodayLog()).toEqual({})
    })

    it('returns today log after toggle', () => {
      habits.addHabit({ name: 'T', icon: '⭐', target: 1, unit: 'session' })
      const id = S.habits[0].id
      habits.toggleHabit(id)
      const log = habits.getTodayLog()
      expect(log[id].done).toBe(true)
    })
  })

  describe('getLogs', () => {
    it('returns all logs', () => {
      expect(habits.getLogs()).toEqual({})
    })
  })
})

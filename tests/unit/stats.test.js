import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/js/storage.js', () => ({
  saveState: vi.fn(),
}))

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

describe('stats module', () => {
  let stats
  let streaks
  let S

  beforeEach(async () => {
    vi.resetModules()
    vi.setSystemTime(new Date('2025-01-15'))

    S = {
      habits: [
        { id: 'h1', name: 'Study', icon: '📚', target: 2, unit: 'hrs' },
        { id: 'h2', name: 'Workout', icon: '🏃', target: 1, unit: 'session' },
      ],
      logs: {},
      moods: {},
      energy: {},
      leaks: {},
      tasks: [],
    }
    streaks = await import('../../src/js/streaks.js')
    streaks.initStateRef(S)

    stats = await import('../../src/js/stats.js')
    stats.initStateRef(S)
  })

  describe('getStats', () => {
    it('returns zero stats when empty', () => {
      const result = stats.getStats()
      expect(result.total).toBe(0)
      expect(result.maxStreak).toBe(0)
      expect(result.moodDays).toBe(0)
    })

    it('counts total completions', () => {
      S.logs['2025-01-15'] = { h1: { done: true } }
      S.logs['2025-01-14'] = { h1: { done: true }, h2: { done: true } }
      const result = stats.getStats()
      expect(result.total).toBe(3)
    })
  })

  describe('todayPct', () => {
    it('returns 0 when no habits', () => {
      S.habits = []
      expect(stats.todayPct()).toBe(0)
    })

    it('returns correct percentage', () => {
      S.logs['2025-01-15'] = { h1: { done: true } }
      expect(stats.todayPct()).toBe(50)
    })

    it('returns 100 when all done', () => {
      S.logs['2025-01-15'] = { h1: { done: true }, h2: { done: true } }
      expect(stats.todayPct()).toBe(100)
    })
  })

  describe('getWeeklyChartData', () => {
    it('returns data for 7 days', () => {
      const data = stats.getWeeklyChartData()
      expect(data).toHaveLength(7)
      data.forEach((d) => {
        expect(d).toHaveProperty('d')
        expect(d).toHaveProperty('label')
        expect(d).toHaveProperty('done')
        expect(d).toHaveProperty('pct')
      })
    })

    it('reflects completed habits', () => {
      S.logs['2025-01-15'] = { h1: { done: true }, h2: { done: true } }
      const data = stats.getWeeklyChartData()
      const today = data.find((d) => d.d === '2025-01-15')
      expect(today.done).toBe(2)
      expect(today.pct).toBe(100)
    })
  })

  describe('getMonthlyChartData', () => {
    it('returns data for all days in month', () => {
      const data = stats.getMonthlyChartData(1, 2025)
      expect(data).toHaveLength(31)
    })
  })

  describe('getCompletionRate', () => {
    it('returns 0 when no logs', () => {
      expect(stats.getCompletionRate()).toBe(0)
    })

    it('returns correct overall rate', () => {
      S.logs['2025-01-15'] = { h1: { done: true } }
      S.logs['2025-01-14'] = { h1: { done: true }, h2: { done: true } }
      const rate = stats.getCompletionRate()
      expect(rate).toBeGreaterThan(0)
    })
  })

  describe('getHabitConsistency', () => {
    it('returns consistency for each habit', () => {
      S.logs['2025-01-15'] = { h1: { done: true } }
      S.logs['2025-01-14'] = { h1: { done: true }, h2: { done: true } }
      const result = stats.getHabitConsistency()
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('h1')
      expect(result[1].id).toBe('h2')
    })
  })

  describe('getWeeklyInsight', () => {
    it('returns start message when no habits', () => {
      S.habits = []
      const insight = stats.getWeeklyInsight()
      expect(insight).toContain('Add habits')
    })

    it('returns encouragement for high completion', () => {
      for (let i = 0; i < 7; i++) {
        S.logs[addDays('2025-01-15', -i)] = { h1: { done: true }, h2: { done: true } }
      }
      const insight = stats.getWeeklyInsight()
      expect(insight).toContain('Incredible')
    })
  })

  describe('getMoodData', () => {
    it('returns weekly mood data', () => {
      S.moods['2025-01-15'] = { val: 4 }
      S.moods['2025-01-14'] = { val: 3 }
      const data = stats.getMoodData()
      expect(data).toHaveLength(7)
    })
  })

  describe('getEnergyData', () => {
    it('returns weekly energy data', () => {
      S.energy['2025-01-15'] = 3
      S.energy['2025-01-14'] = 2
      const data = stats.getEnergyData()
      expect(data).toHaveLength(7)
    })
  })

  describe('getLeakData', () => {
    it('returns weekly leak data', () => {
      S.leaks['2025-01-15'] = [{ label: 'Scrolling', mins: 30, id: 'l1' }]
      const data = stats.getLeakData()
      expect(data).toHaveLength(7)
      const today = data.find((d) => d.mins > 0)
      expect(today.mins).toBe(30)
    })
  })

  describe('getRealityData', () => {
    it('returns weekly reality check data', () => {
      S.tasks = [
        { id: 't1', date: '2025-01-15', title: 'Study', done: true, time: '10:00', plannedMins: 60 },
        { id: 't2', date: '2025-01-15', title: 'Read', done: false, time: '14:00', plannedMins: 30 },
      ]
      const data = stats.getRealityData()
      expect(data).toHaveLength(7)
      const today = data.find((d) => d.d === '2025-01-15')
      expect(today.planned).toBe(2)
      expect(today.completed).toBe(1)
      expect(today.pct).toBe(50)
    })
  })

  describe('getRCInsight', () => {
    it('returns start message when no tasks planned', () => {
      const insight = stats.getRCInsight()
      expect(insight).toContain('Start adding tasks')
    })

    it('returns encouragement for high completion', () => {
      for (let i = 0; i < 7; i++) {
        const d = addDays('2025-01-15', -i)
        S.tasks.push(
          { id: `t${i}a`, date: d, title: 'Task', done: true, time: '10:00', plannedMins: 30 },
          { id: `t${i}b`, date: d, title: 'Task2', done: true, time: '14:00', plannedMins: 30 },
        )
      }
      const insight = stats.getRCInsight()
      expect(insight).toContain('Crushing')
    })
  })

  describe('cache', () => {
    it('invalidates stats cache', () => {
      stats.getStats()
      stats.invalidateStatsCache()
      const result = stats.getStats()
      expect(result).toBeDefined()
    })
  })
})

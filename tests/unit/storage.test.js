import { describe, it, expect, vi, beforeEach } from 'vitest'

const STORE_KEY = 'hb_v2'
const REAL_MODULE = '../../src/js/storage.js'

describe('storage module', () => {
  let storage
  let lsStore

  beforeEach(async () => {
    vi.resetModules()
    lsStore = {}

    globalThis.localStorage = {
      getItem: vi.fn((key) => lsStore[key] ?? null),
      setItem: vi.fn((key, val) => { lsStore[key] = val }),
      removeItem: vi.fn((key) => { delete lsStore[key] }),
    }

    URL.createObjectURL = vi.fn(() => 'blob:url')
    URL.revokeObjectURL = vi.fn()
  })

  describe('loadState', () => {
    it('returns defaults merged with migrated null data when nothing stored', async () => {
      globalThis.indexedDB = { open: vi.fn(() => { throw new Error('no indexedDB') }) }
      storage = await import(REAL_MODULE)
      const state = await storage.loadState({})
      expect(state.habits).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.earnedBadges).toEqual([])
    })

    it('reads from localStorage when indexedDB fails', async () => {
      globalThis.indexedDB = { open: vi.fn(() => { throw new Error('no indexedDB') }) }
      lsStore[STORE_KEY] = JSON.stringify({ profile: { name: 'Test' }, habits: [{ id: 'h1' }] })
      storage = await import(REAL_MODULE)
      const state = await storage.loadState({})
      expect(state.profile).toEqual({ name: 'Test' })
      expect(state.habits).toEqual([{ id: 'h1' }])
    })

    it('migrates old localStorage keys', async () => {
      globalThis.indexedDB = { open: vi.fn(() => { throw new Error('no indexedDB') }) }
      lsStore['hb_profile'] = JSON.stringify({ name: 'Migrated' })
      lsStore['hb_habits'] = JSON.stringify([{ id: 'h1', name: 'Old' }])
      storage = await import(REAL_MODULE)
      const defaults = { profile: null, habits: [] }
      const state = await storage.loadState(defaults)
      expect(state.profile).toEqual({ name: 'Migrated' })
      expect(state.habits).toEqual([{ id: 'h1', name: 'Old' }])
    })

    it('includes earnedBadges from migration', async () => {
      globalThis.indexedDB = { open: vi.fn(() => { throw new Error('no indexedDB') }) }
      storage = await import(REAL_MODULE)
      const state = await storage.loadState({})
      expect(state.earnedBadges).toEqual([])
    })
  })

  describe('exportData', () => {
    it('triggers a file download', async () => {
      globalThis.indexedDB = { open: vi.fn(() => { throw new Error('no indexedDB') }) }
      storage = await import(REAL_MODULE)
      const click = vi.fn()
      document.createElement = vi.fn(() => ({ href: '', download: '', click }))
      storage.exportData({ habits: [] })
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(click).toHaveBeenCalled()
    })
  })

  describe('importData', () => {
    it('parses valid JSON file', async () => {
      storage = await import(REAL_MODULE)
      const blob = new Blob([JSON.stringify({ habits: [{ id: 'h1' }] })], { type: 'application/json' })
      const file = new File([blob], 'test.json')
      const result = await storage.importData(file)
      expect(result).toEqual({ habits: [{ id: 'h1' }] })
    })

    it('rejects invalid JSON', async () => {
      storage = await import(REAL_MODULE)
      const blob = new Blob(['not json'], { type: 'text/plain' })
      const file = new File([blob], 'bad.json')
      await expect(storage.importData(file)).rejects.toThrow('Invalid JSON file')
    })
  })
})

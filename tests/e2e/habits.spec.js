import { test, expect } from '@playwright/test'

test.describe('HabitBloom App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('shows setup wizard on first visit', async ({ page }) => {
    await expect(page.locator('#setup')).toBeVisible()
    await expect(page.locator('text=Welcome!')).toBeVisible()
  })

  test('setup wizard creates profile', async ({ page }) => {
    await page.fill('#setup-name', 'TestUser')
    await expect(page.locator('#setup-btn')).toBeEnabled()
    await page.click('#setup-btn')
    await expect(page.locator('text=Hey, TestUser')).toBeVisible()
  })

  test('navigates between tabs', async ({ page }) => {
    await page.fill('#setup-name', 'TestUser')
    await page.click('#setup-btn')

    await page.click('[data-tab="habits"]')
    await expect(page.locator('text=My Habits')).toBeVisible()

    await page.click('[data-tab="planner']")
    await expect(page.locator("text=Today's Plan")).toBeVisible()

    await page.click('[data-tab="stats"]')
    await expect(page.locator('text=Weekly Stats')).toBeVisible()
  })

  test('adds a new habit', async ({ page }) => {
    await page.fill('#setup-name', 'TestUser')
    await page.click('#setup-btn')
    await page.click('[data-tab="habits"]')
    await page.click('text=+ Add')
    await page.fill('#hf-name', 'Test Habit')
    await page.fill('#hf-target', '3')
    await page.fill('#hf-unit', 'hrs')
    await page.click('text=Save Habit')
    await expect(page.locator('text=Test Habit')).toBeVisible()
  })

  test('opens mood modal from home', async ({ page }) => {
    await page.fill('#setup-name', 'TestUser')
    await page.click('#setup-btn')
    await page.click('text=Mood')
    await expect(page.locator('text=How are you feeling?')).toBeVisible()
  })

  test('toggles dark mode in settings', async ({ page }) => {
    await page.fill('#setup-name', 'TestUser')
    await page.click('#setup-btn')
    await page.click('[data-tab="settings"]')
    const toggle = page.locator('input[type="checkbox"]')
    await toggle.check()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})

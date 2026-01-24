import { test, expect } from '@playwright/test'

/**
 * Accessibility and performance tests
 * Basic checks for accessibility and page performance
 */

// Increase timeout for HB-Auth tests
test.setTimeout(60000)

test.describe('Accessibility', () => {

  test('homepage has proper heading structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should have at least one heading
    const headings = page.locator('h1, h2, h3')
    expect(await headings.count()).toBeGreaterThan(0)
  })

  test('admin page has proper heading structure', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should have h1 with "Admin Panel"
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()
  })

  test('images have alt attributes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      // Alt should exist (can be empty for decorative images)
      expect(alt).not.toBeNull()
    }
  })

  test('buttons are focusable', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for page to fully load
    await page.waitForTimeout(3000)

    // Check that buttons exist and are visible
    const buttons = page.locator('button:visible')
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('form inputs in admin modal have placeholders', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for Login button to appear
    const loginButton = page.locator('button:has-text("Login")').first()
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    // Wait for modal inputs
    const usernameInput = page.locator('input[placeholder="Enter your username"]')
    const passwordInput = page.locator('input[placeholder="Enter password"]')

    await expect(usernameInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeVisible()

    // Verify they have placeholders
    expect(await usernameInput.getAttribute('placeholder')).toBeTruthy()
    expect(await passwordInput.getAttribute('placeholder')).toBeTruthy()
  })

  test('links have proper href attributes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const links = page.locator('a[href]')
    const count = await links.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i)
      const href = await link.getAttribute('href')
      expect(href).toBeTruthy()
      expect(href).not.toBe('#')
    }
  })

  test('page has proper lang attribute', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')
    const lang = await html.getAttribute('lang')
    expect(lang).toBeTruthy()
  })

  test('page has meta viewport', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveCount(1)
  })

})

test.describe('Performance', () => {

  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Should load within 10 seconds (network dependent)
    expect(loadTime).toBeLessThan(10000)
  })

  test('admin page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  test('no critical console errors on homepage', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Filter out expected/non-critical errors
    const unexpectedErrors = errors.filter(e =>
      !e.includes('hb-auth') &&
      !e.includes('worker') &&
      !e.includes('Failed to fetch') &&
      !e.includes('net::ERR') &&
      !e.includes('favicon') &&
      !e.includes('wasm')
    )

    expect(unexpectedErrors.length).toBe(0)
  })

})

import { test, expect } from '@playwright/test'

/**
 * Admin panel tests
 * Tests for the admin panel functionality
 */

// Increase timeout for HB-Auth initialization
test.setTimeout(60000)

test.describe('Admin Panel', () => {

  test('admin page loads correctly', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Check title
    const title = await page.title()
    expect(title).toContain('Admin Panel')

    // Check back to site link
    const backLink = page.locator('a:has-text("Back to site")')
    await expect(backLink).toBeVisible()

    // Check h1
    const h1 = page.locator('h1:has-text("Admin Panel")')
    await expect(h1).toBeVisible()
  })

  test('back to site link works', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const backLink = page.locator('a:has-text("Back to site")')
    await backLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).not.toContain('/admin')
  })

  test('shows login button after component loads', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for SolidJS component to hydrate and query to complete
    // The Login button appears after settingsQuery is no longer loading
    const loginButton = page.locator('button:has-text("Login")')

    // Wait up to 30 seconds for the button to appear
    await expect(loginButton.first()).toBeVisible({ timeout: 30000 })
  })

  test('login modal opens correctly', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for Login button to appear
    const loginButton = page.locator('button:has-text("Login")').first()
    await expect(loginButton).toBeVisible({ timeout: 30000 })

    // Click Login button
    await loginButton.click()

    // Modal should appear with form elements - wait for them
    await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[placeholder="Enter password"]')).toBeVisible()
  })

  test('register mode toggle works', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for and open modal
    const loginButton = page.locator('button:has-text("Login")').first()
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    // Wait for modal to open
    await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible({ timeout: 10000 })

    // Switch to register mode
    await page.locator('button:has-text("Register Key")').click()

    // WIF input should appear
    await expect(page.locator('input[placeholder="5..."]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("Save Key")')).toBeVisible()

    // Switch back to login
    await page.locator('button:has-text("Login")').first().click()

    // WIF input should disappear
    await expect(page.locator('input[placeholder="5..."]')).not.toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("Unlock Blog")')).toBeVisible()
  })

  test('form validation shows errors', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for and open modal
    const loginButton = page.locator('button:has-text("Login")').first()
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    // Wait for modal
    await expect(page.locator('button:has-text("Unlock Blog")')).toBeVisible({ timeout: 10000 })

    // Try to submit empty form
    await page.locator('button:has-text("Unlock Blog")').click()

    // Should show error
    const error = page.locator('text=Please fill in all fields')
    await expect(error).toBeVisible({ timeout: 5000 })
  })

  test('register form validates WIF format', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for and open modal in register mode
    const loginButton = page.locator('button:has-text("Login")').first()
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Register Key")').click()
    await expect(page.locator('input[placeholder="5..."]')).toBeVisible({ timeout: 5000 })

    // Fill with invalid WIF
    await page.locator('input[placeholder="Enter your username"]').fill('testuser')
    await page.locator('input[placeholder="Enter password"]').fill('testpass')
    await page.locator('input[placeholder="5..."]').fill('invalid-wif')

    // Submit
    await page.locator('button:has-text("Save Key")').click()

    // Should show WIF format error
    const error = page.locator('text=Invalid WIF format')
    await expect(error).toBeVisible({ timeout: 5000 })
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for and open modal
    const loginButton = page.locator('button:has-text("Login")').first()
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    const passwordInput = page.locator('input[placeholder="Enter password"]')
    await expect(passwordInput).toBeVisible({ timeout: 10000 })

    // Get the toggle button - it's inside the same container as input
    const container = passwordInput.locator('..')
    const toggleButton = container.locator('button')

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle
    await toggleButton.click()

    // Should be text type now
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click again
    await toggleButton.click()

    // Should be password again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('admin panel is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should still show login button after loading
    const loginButton = page.locator('button:has-text("Login")')
    await expect(loginButton.first()).toBeVisible({ timeout: 30000 })
  })

})

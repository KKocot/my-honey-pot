import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * Admin panel tests
 * Tests for the admin panel functionality
 */

// Increase timeout for HB-Auth initialization
test.setTimeout(60000)

const footerLoginButton = (page: Page) => page.getByRole('button', { name: 'Login with Hive' })

// The panel's own LoginModal: Save on Hive while logged out opens it.
async function openLoginModal(page: Page): Promise<Locator> {
  const saveButton = page.getByRole('button', { name: 'Save on Hive' })
  await expect(saveButton).toBeVisible({ timeout: 30000 })
  await saveButton.click()

  const dialog = page.getByRole('dialog', { name: 'Login Required' })
  await expect(dialog.locator('input[placeholder="Enter your username"]')).toBeVisible({ timeout: 10000 })
  return dialog
}

test.describe('Admin Panel', () => {

  test('admin page loads correctly', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Check title
    await expect(page).toHaveTitle(/^Settings - .+ Blog$/)

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

    await expect(footerLoginButton(page)).toBeVisible({ timeout: 30000 })
  })

  test('login modal opens correctly', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const dialog = await openLoginModal(page)

    await expect(dialog.getByRole('heading', { name: 'Login Required' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Login', exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Register Key', exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Keychain', exact: true })).toBeVisible()
    await expect(dialog.locator('input[placeholder="Enter password"]')).toBeVisible()
  })

  test('footer Login button is clickable on admin page', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await footerLoginButton(page).click({ timeout: 10000 })
    await expect(page.getByRole('dialog', { name: 'Login Required' })).toBeVisible()
  })

  test('register mode toggle works', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const dialog = await openLoginModal(page)

    await dialog.getByRole('button', { name: 'Register Key', exact: true }).click()

    await expect(dialog.locator('input[placeholder="5..."]')).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByRole('button', { name: 'Save Key' })).toBeVisible()

    await dialog.getByRole('button', { name: 'Login', exact: true }).click()

    await expect(dialog.locator('input[placeholder="5..."]')).not.toBeVisible({ timeout: 5000 })
    await expect(dialog.getByRole('button', { name: 'Unlock Blog' })).toBeVisible()
  })

  test('submit stays disabled until all fields are filled', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const dialog = await openLoginModal(page)

    const unlockButton = dialog.getByRole('button', { name: 'Unlock Blog' })
    await expect(unlockButton).toBeDisabled()

    await dialog.locator('input[placeholder="Enter your username"]').fill('testuser')
    await expect(unlockButton).toBeDisabled()

    await dialog.locator('input[placeholder="Enter password"]').fill('testpass')
    await expect(unlockButton).toBeEnabled()
  })

  test('register form validates WIF format', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const dialog = await openLoginModal(page)

    await dialog.getByRole('button', { name: 'Register Key', exact: true }).click()
    await expect(dialog.locator('input[placeholder="5..."]')).toBeVisible({ timeout: 5000 })

    await dialog.locator('input[placeholder="Enter your username"]').fill('testuser')
    await dialog.locator('input[placeholder="Enter password"]').fill('testpass')
    await dialog.locator('input[placeholder="5..."]').fill('invalid-wif')

    await dialog.getByRole('button', { name: 'Save Key' }).click()

    const error = dialog.getByText('Invalid WIF format')
    await expect(error).toBeVisible({ timeout: 5000 })
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const dialog = await openLoginModal(page)

    const passwordInput = dialog.locator('input[placeholder="Enter password"]')
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

    await expect(footerLoginButton(page)).toBeVisible({ timeout: 30000 })
  })

})

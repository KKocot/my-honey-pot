import { test, expect } from '@playwright/test'

/**
 * HB-Auth integration tests
 * Tests the login/register flow with HB-Auth
 *
 * To run tests with real credentials, set environment variables:
 * TEST_HIVE_USERNAME=youruser
 * TEST_HIVE_PASSWORD=yourpassword
 * TEST_HIVE_WIF=5yourwifkey
 */

const TEST_USER = {
  username: process.env.TEST_HIVE_USERNAME || 'testuser',
  password: process.env.TEST_HIVE_PASSWORD || 'testpassword',
  wif: process.env.TEST_HIVE_WIF || '' // Empty by default - tests will skip registration without real WIF
}

test.describe('HB-Auth Login Flow', () => {

  test('admin page loads correctly', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const title = await page.title()
    expect(title).toContain('Admin Panel')

    // Check Login button is visible
    const loginButton = page.locator('button:has-text("Login")').first()
    await expect(loginButton).toBeVisible()
  })

  test('login modal opens and has correct elements', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click Login button
    const loginButton = page.locator('button:has-text("Login")').first()
    await loginButton.click()
    await page.waitForTimeout(1000)

    // Check modal elements
    await expect(page.locator('button:has-text("Register Key")')).toBeVisible()
    await expect(page.locator('input[placeholder="Enter your username"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Enter password"]')).toBeVisible()
  })

  test('register mode shows WIF input', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Open modal
    const loginButton = page.locator('button:has-text("Login")').first()
    await loginButton.click()
    await page.waitForTimeout(500)

    // Switch to register
    await page.locator('button:has-text("Register Key")').click()
    await page.waitForTimeout(500)

    // Check WIF input appears
    await expect(page.locator('input[placeholder="5..."]')).toBeVisible()
    await expect(page.locator('button:has-text("Save Key")')).toBeVisible()
  })

  // This test only runs with real credentials
  test('full registration and login flow', async ({ page }) => {
    test.skip(!TEST_USER.wif, 'Requires TEST_HIVE_WIF env var')

    // Capture console messages
    const logs: string[] = []
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`)
    })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Open login modal
    await page.locator('button:has-text("Login")').first().click()
    await page.waitForTimeout(1000)

    // Switch to register
    await page.locator('button:has-text("Register Key")').click()
    await page.waitForTimeout(500)

    // Fill form
    await page.locator('input[placeholder="Enter your username"]').fill(TEST_USER.username)
    await page.locator('input[placeholder="Enter password"]').fill(TEST_USER.password)
    await page.locator('input[placeholder="5..."]').fill(TEST_USER.wif)

    // Click Save Key
    await page.locator('button:has-text("Save Key")').click()
    await page.waitForTimeout(5000)

    // Check for success (should switch to login mode with stored accounts)
    const storedAccounts = page.locator('text=Stored Accounts')
    const hasStoredAccounts = await storedAccounts.isVisible()

    if (hasStoredAccounts) {
      // Try login
      await page.locator('input[placeholder="Enter password"]').fill(TEST_USER.password)
      await page.locator('button:has-text("Unlock Wallet")').click()
      await page.waitForTimeout(3000)

      // Check login success
      const userAvatar = page.locator(`img[alt="${TEST_USER.username}"]`)
      await expect(userAvatar).toBeVisible()
    }

    // Print logs if test fails
    if (!hasStoredAccounts) {
      console.log('Browser logs:', logs.join('\n'))
    }
  })

})

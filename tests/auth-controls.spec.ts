import { test, expect, type Page } from '@playwright/test'

/**
 * Footer AuthControls island: Login button, login modal, owner shortcuts.
 * Owner session is simulated via persisted keychain metadata (auth-persistence.ts)
 * plus a stub window.hive_keychain, so no real key is needed.
 */

test.setTimeout(60000)

const footerLoginButton = (page: Page) => page.getByRole('button', { name: 'Login with Hive' })

async function readOwnerUsername(page: Page): Promise<string> {
  return (await page.locator('[data-footer-controls]').getAttribute('data-owner-username')) ?? ''
}

async function seedKeychainSession(page: Page, username: string) {
  await page.addInitScript((user) => {
    localStorage.setItem('mhp_username', user)
    localStorage.setItem('mhp_login_type', 'keychain')
    localStorage.setItem('mhp_key_type', 'posting')
    localStorage.setItem('mhp_session_expires_at', String(Date.now() + 10 * 60 * 1000))
    Object.defineProperty(window, 'hive_keychain', {
      configurable: true,
      value: { requestSignBuffer: () => {} },
    })
  }, username)
}

test.describe('Footer auth controls', () => {

  test('login button is visible in the footer on the homepage', async ({ page }) => {
    await page.goto('/')
    await expect(footerLoginButton(page)).toBeVisible({ timeout: 30000 })
  })

  test('login button opens the modal with Keychain tab', async ({ page }) => {
    await page.goto('/')
    const loginButton = footerLoginButton(page)
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    const dialog = page.getByRole('dialog', { name: 'Login Required' })
    await expect(dialog).toBeVisible({ timeout: 10000 })

    const keychainTab = dialog.getByRole('button', { name: 'Keychain', exact: true })
    await expect(keychainTab).toBeVisible()
    await keychainTab.click()

    await expect(dialog.getByText('Hive Keychain not detected')).toBeVisible({ timeout: 10000 })
  })

  test('modal closes via close button', async ({ page }) => {
    await page.goto('/')
    const loginButton = footerLoginButton(page)
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    const dialog = page.getByRole('dialog', { name: 'Login Required' })
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await dialog.getByRole('button', { name: 'Close login modal' }).click()
    await expect(dialog).toBeHidden()
  })

  test('modal closes on Escape and returns focus to the Login button', async ({ page }) => {
    await page.goto('/')
    const loginButton = footerLoginButton(page)
    await expect(loginButton).toBeVisible({ timeout: 30000 })
    await loginButton.click()

    const dialog = page.getByRole('dialog', { name: 'Login Required' })
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog.locator(':focus')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(loginButton).toBeFocused()
  })

  test('owner links are hidden for anonymous visitors', async ({ page }) => {
    await page.goto('/')
    await expect(footerLoginButton(page)).toBeVisible({ timeout: 30000 })

    await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'New post', exact: true })).toHaveCount(0)
  })

  test('owner session shows admin shortcuts', async ({ page }) => {
    await page.goto('/')
    const owner = await readOwnerUsername(page)
    test.skip(!owner, 'HIVE_USERNAME not configured for this server')

    await seedKeychainSession(page, owner)
    await page.reload()

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 30000 })
    await expect(footerLoginButton(page)).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveAttribute('href', '/admin')
    await expect(page.getByRole('link', { name: 'New post', exact: true })).toHaveAttribute('href', '/admin/submit')
  })

  test('non-owner session hides admin shortcuts', async ({ page }) => {
    await page.goto('/')
    const owner = await readOwnerUsername(page)
    const visitor = owner === 'not-the-owner' ? 'someone-else' : 'not-the-owner'

    await seedKeychainSession(page, visitor)
    await page.reload()

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'New post', exact: true })).toHaveCount(0)
  })

})

test.describe('Admin loaders before hydration', () => {

  const blockAdminIslands = (page: Page) =>
    page.route(/\/components\/admin\//, (route) => route.abort())

  test('settings page shows loader until AdminPanel hydrates', async ({ page }) => {
    await blockAdminIslands(page)
    await page.goto('/admin')

    await expect(page.getByRole('status').filter({ hasText: 'Loading admin panel...' })).toBeVisible()
  })

  test('submit page shows loader until SubmitPanel hydrates', async ({ page }) => {
    await blockAdminIslands(page)
    await page.goto('/admin/submit')

    await expect(page.getByRole('status').filter({ hasText: 'Loading editor...' })).toBeVisible()
  })

})

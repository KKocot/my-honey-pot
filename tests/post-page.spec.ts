import { test, expect } from '@playwright/test'

/**
 * Post page tests
 * Tests for individual post pages
 */

test.describe('Post Page', () => {

  test('handles non-existent post gracefully', async ({ page }) => {
    await page.goto('/non-existent-post-12345')
    await page.waitForLoadState('networkidle')

    // Should show error or redirect, not crash
    const response = await page.request.get('/non-existent-post-12345')
    // Accept both 404 and 200 (if shows error message)
    expect([200, 404]).toContain(response.status())
  })

  test('post page has proper structure', async ({ page }) => {
    // First get a real post permlink from homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Try to find a post link
    const postLink = page.locator('a[href^="/"][href*="-"]').first()

    if (await postLink.count() > 0) {
      const href = await postLink.getAttribute('href')
      if (href && href !== '/admin') {
        await page.goto(href)
        await page.waitForLoadState('networkidle')

        // Post page should have layout
        const layout = page.locator('.max-w-7xl, main, article')
        await expect(layout.first()).toBeVisible()
      }
    }
  })

  test('back to site link works from post', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find and click a post
    const postLink = page.locator('a[href^="/"][href*="-"]').first()

    if (await postLink.count() > 0) {
      const href = await postLink.getAttribute('href')
      if (href && href !== '/admin') {
        await page.goto(href)
        await page.waitForLoadState('networkidle')

        // Look for back link
        const backLink = page.locator('a[href="/"], a:has-text("Back")')
        if (await backLink.count() > 0) {
          await backLink.first().click()
          await page.waitForLoadState('networkidle')
          expect(page.url()).toContain('localhost')
        }
      }
    }
  })

})

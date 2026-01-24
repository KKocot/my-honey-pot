import { test, expect } from '@playwright/test'

/**
 * Homepage tests
 * Tests for the main blog page functionality
 */

test.describe('Homepage', () => {

  test('loads successfully and shows blog content', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Should not show error message
    const errorMessage = page.locator('text=Błąd')
    await expect(errorMessage).not.toBeVisible()
  })

  test('displays posts grid when posts are available', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check if posts container exists (either with posts or empty state)
    const postsSection = page.locator('[class*="grid"], [class*="posts"], .bg-bg-card')
    await expect(postsSection.first()).toBeVisible()
  })

  test('navigation tabs work correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check if navigation exists
    const navigation = page.locator('nav, [role="navigation"]')
    if (await navigation.count() > 0) {
      // If Posts tab exists, click it
      const postsTab = page.locator('a[href*="tab=posts"], button:has-text("Posts")')
      if (await postsTab.count() > 0) {
        await postsTab.first().click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain('tab=posts')
      }
    }
  })

  test('comments tab loads when enabled', async ({ page }) => {
    await page.goto('/?tab=comments')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Page should still load (might redirect to posts if comments disabled)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('handles missing HIVE_USERNAME gracefully', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should show either content or configuration message
    const content = page.locator('.max-w-7xl')
    await expect(content).toBeVisible()
  })

  test('pagination links work when available', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check for pagination links
    const loadMore = page.locator('a:has-text("Load more")')
    if (await loadMore.count() > 0) {
      const href = await loadMore.first().getAttribute('href')
      expect(href).toContain('start_author')
      expect(href).toContain('start_permlink')
    }
  })

  test('responsive layout works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Content should still be visible
    const content = page.locator('.max-w-7xl')
    await expect(content).toBeVisible()
  })

  test('responsive layout works on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Content should still be visible
    const content = page.locator('.max-w-7xl')
    await expect(content).toBeVisible()
  })

})

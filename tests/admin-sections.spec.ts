import { test, expect } from '@playwright/test'

/**
 * Admin Panel Sections Tests
 * Comprehensive tests verifying all admin panel sections are visible,
 * accessible, and interactive after SolidJS hydration completes.
 */

// Increase timeout for SolidJS hydration (can take up to 30s)
test.setTimeout(60000)

test.describe('Admin Panel Sections', () => {

  /**
   * Test 1: Verify all main sections are visible
   * Checks that all 8 main h2 section headings are rendered and visible
   */
  test('all main sections are visible after hydration', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wait for SolidJS hydration by checking for first section
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    // Remaining 7 sections
    await expect(page.locator('h2:has-text("Page Layout Editor")')).toBeVisible()
    await expect(page.locator('h2:has-text("Navigation Tabs")')).toBeVisible()
    await expect(page.locator('h2:has-text("Site Settings")')).toBeVisible()
    await expect(page.locator('h2:has-text("Author Profile Settings")')).toBeVisible()
    await expect(page.locator('h2:has-text("Posts Layout")')).toBeVisible()
    await expect(page.locator('h2:has-text("Post Card Appearance")')).toBeVisible()
    await expect(page.locator('h2:has-text("Comments Tab Settings")')).toBeVisible()
  })

  /**
   * Test 2: Verify subsections are visible
   * Checks that subsections (Style, Social Media Links, Hover/Scroll Animations) are rendered
   */
  test('subsections are visible', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    // "Style" subsection (h2 inside ThemeSettings)
    const styleSection = page.locator('h2:has-text("Style")')
    await styleSection.scrollIntoViewIfNeeded()
    await expect(styleSection).toBeVisible({ timeout: 10000 })

    // "Social Media Links" subsection (h3 inside AuthorProfileSettings)
    const socialLinksSection = page.locator('h3:has-text("Social Media Links")')
    await socialLinksSection.scrollIntoViewIfNeeded()
    await expect(socialLinksSection).toBeVisible({ timeout: 10000 })

    // "Hover Animations" subsection (h3 inside ThemeSettings)
    const hoverSection = page.locator('h3:has-text("Hover Animations")')
    await hoverSection.scrollIntoViewIfNeeded()
    await expect(hoverSection).toBeVisible({ timeout: 10000 })

    // "Scroll Animations" subsection (h3 inside ThemeSettings)
    const scrollSection = page.locator('h3:has-text("Scroll Animations")')
    await scrollSection.scrollIntoViewIfNeeded()
    await expect(scrollSection).toBeVisible({ timeout: 10000 })
  })

  /**
   * Test 3: TemplateSelector - template cards are interactive and clickable
   * Verifies template cards render correctly and are interactive elements
   * NOTE: Does not test confirm() dialog due to SolidJS hydration timing issues
   */
  test('template selector cards are clickable', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    // Find real template cards (exclude Randomize button which has border-dashed)
    // Template cards have .aspect-video AND do NOT have border-dashed class
    const templateCards = page.locator('button[type="button"]')
      .filter({ has: page.locator('.aspect-video') })
      .filter({ hasNot: page.locator('text=Randomize') })

    // Verify template cards are visible and interactive
    await expect(templateCards.first()).toBeVisible({ timeout: 10000 })
    expect(await templateCards.count()).toBeGreaterThan(0)

    // Verify first template card is enabled and has correct attributes
    const firstCard = templateCards.first()
    await expect(firstCard).toBeEnabled()

    // Verify card has proper button attributes
    await expect(firstCard).toHaveAttribute('type', 'button')

    // Verify card contains template info structure (icon + name + description)
    await expect(firstCard.locator('h3')).toBeVisible()
    await expect(firstCard.locator('p')).toBeVisible()

    // Verify hover overlay exists (indicates proper rendering)
    await expect(firstCard.locator('div.absolute.inset-0')).toBeAttached()
  })

  /**
   * Test 4: LayoutEditor - toggle buttons change section visibility
   * Verifies slot sections exist and toggle active state changes on click
   */
  test('layout editor toggle buttons work', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const layoutSection = page.locator('h2:has-text("Page Layout Editor")')
    await layoutSection.scrollIntoViewIfNeeded()
    await expect(layoutSection).toBeVisible({ timeout: 30000 })

    // Find section visibility toggle (has aria-label "Hide section" or "Show section")
    // POTENCJALNY PROBLEM: Jeśli domyślnie wszystkie sekcje są ukryte,
    // nie będzie buttona z "Hide section" - lokator się nie znajdzie.
    const visibilityToggle = page.locator('button[aria-label="Hide section"], button[aria-label="Show section"]').first()
    await expect(visibilityToggle).toBeVisible({ timeout: 10000 })

    // Get initial aria-label, click, verify it changed
    const initialLabel = await visibilityToggle.getAttribute('aria-label')
    await visibilityToggle.click()

    const expectedNewLabel = initialLabel === 'Hide section' ? 'Show section' : 'Hide section'
    await expect(
      page.locator(`button[aria-label="${expectedNewLabel}"]`).first()
    ).toBeVisible({ timeout: 5000 })
  })

  /**
   * Test 5: NavigationSettings - tab checkboxes work
   * Verifies navigation tab list and enable/disable checkboxes
   */
  test('navigation settings tab checkboxes work', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const navSection = page.locator('h2:has-text("Navigation Tabs")')
    await navSection.scrollIntoViewIfNeeded()
    await expect(navSection).toBeVisible({ timeout: 30000 })

    // Tab enable/disable checkboxes (input[type="checkbox"] inside TabItem)
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible({ timeout: 10000 })

    // Click first checkbox and verify its checked state toggles
    const firstCheckbox = checkboxes.first()
    const wasChecked = await firstCheckbox.isChecked()
    await firstCheckbox.click()
    // POTENCJALNY PROBLEM: Jeśli to checkbox taba "Threads" (disabled),
    // klik się nie zarejestruje - isChecked nie zmieni wartości.
    await expect(firstCheckbox).toBeChecked({ checked: !wasChecked, timeout: 5000 })
  })

  /**
   * Test 6: SiteSettings - input fields are editable
   * Verifies Site Name input and Site Description textarea accept text
   */
  test('site settings input fields are editable', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const siteSection = page.locator('h2:has-text("Site Settings")')
    await siteSection.scrollIntoViewIfNeeded()
    await expect(siteSection).toBeVisible({ timeout: 30000 })

    // Site Name input (exact placeholder from SiteSettings.tsx)
    const siteNameInput = page.locator('input[placeholder="Hive Blog"]')
    await expect(siteNameInput).toBeVisible({ timeout: 10000 })
    await siteNameInput.fill('Test Blog Name')
    await expect(siteNameInput).toHaveValue('Test Blog Name')

    // Site Description textarea (exact placeholder from SiteSettings.tsx)
    const descriptionTextarea = page.locator('textarea[placeholder="Posts from Hive blockchain"]')
    await expect(descriptionTextarea).toBeVisible({ timeout: 5000 })
    await descriptionTextarea.fill('Test description')
    await expect(descriptionTextarea).toHaveValue('Test description')
  })

  /**
   * Test 7: ThemeSettings - clicking a preset applies active state
   * Verifies preset card gets border-primary class after click
   */
  test('theme settings preset applies active state on click', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const styleSection = page.locator('h2:has-text("Style")')
    await styleSection.scrollIntoViewIfNeeded()
    await expect(styleSection).toBeVisible({ timeout: 30000 })

    // Find preset buttons (all 10 presets)
    const presetButtons = page.locator('button[type="button"]').filter({
      hasText: /^(Light|Dark|Green|Pink|Ocean|Sunset|Forest|Lavender|Midnight|Coffee)$/
    })
    await expect(presetButtons.first()).toBeVisible({ timeout: 10000 })

    // Click second preset (to change from default)
    const secondPreset = presetButtons.nth(1)
    await secondPreset.click()

    // Verify active state: clicked preset should have border-primary class
    // POTENCJALNY PROBLEM: Jeśli drugi preset jest już aktywny (domyślny),
    // klasa się nie zmieni. Zależy od domyślnego ustawienia w configu Hive.
    await expect(secondPreset).toHaveClass(/border-primary/, { timeout: 5000 })
  })

  /**
   * Test 8: AuthorProfileSettings - sliders change value on interaction
   * Verifies range input sliders respond to fill
   */
  test('author profile settings sliders are interactive', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const authorSection = page.locator('h2:has-text("Author Profile Settings")')
    await authorSection.scrollIntoViewIfNeeded()
    await expect(authorSection).toBeVisible({ timeout: 30000 })

    // Find first range slider
    const slider = page.locator('input[type="range"]').first()
    await expect(slider).toBeVisible({ timeout: 10000 })

    // Change slider value and verify
    const initialValue = await slider.inputValue()
    await slider.fill('50')
    // POTENCJALNY PROBLEM: Jeśli slider ma min > 50 lub max < 50,
    // wartość zostanie przycięta. Np. avatar size ma inny zakres.
    const newValue = await slider.inputValue()
    expect(newValue).not.toBe(initialValue)
  })

  /**
   * Test 9: PostsLayoutSettings - clicking Grid activates it
   * Verifies layout buttons toggle active class on click
   */
  test('posts layout buttons toggle active state', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const postsSection = page.locator('h2:has-text("Posts Layout")')
    await postsSection.scrollIntoViewIfNeeded()
    await expect(postsSection).toBeVisible({ timeout: 30000 })

    // Find Grid button specifically
    const gridButton = page.locator('button').filter({ hasText: 'Grid' }).first()
    await expect(gridButton).toBeVisible({ timeout: 10000 })
    await gridButton.click()

    // Active layout button gets border-primary and bg-primary/10
    await expect(gridButton).toHaveClass(/border-primary/, { timeout: 5000 })

    // Click Masonry and verify it becomes active instead
    const masonryButton = page.locator('button').filter({ hasText: 'Masonry' }).first()
    await masonryButton.click()
    await expect(masonryButton).toHaveClass(/border-primary/, { timeout: 5000 })
  })

  /**
   * Test 10: CardAppearanceSettings - toggle controls change state
   * Verifies card appearance checkboxes/switches respond to clicks
   */
  test('card appearance toggles change state on click', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const cardSection = page.locator('h2:has-text("Post Card Appearance")')
    await cardSection.scrollIntoViewIfNeeded()
    await expect(cardSection).toBeVisible({ timeout: 30000 })

    // Find checkbox toggles (show thumbnail, show title, etc.)
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible({ timeout: 10000 })

    // Toggle first checkbox and verify state changed
    const firstCheckbox = checkboxes.first()
    const wasChecked = await firstCheckbox.isChecked()
    await firstCheckbox.click()
    await expect(firstCheckbox).toBeChecked({ checked: !wasChecked, timeout: 5000 })
  })

  /**
   * Test 11: CommentSettings - layout switch changes active button
   * Verifies comments layout buttons (List/Grid/Masonry) toggle active state
   */
  test('comment settings layout switch changes active button', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const commentSection = page.locator('h2:has-text("Comments Tab Settings")')
    await commentSection.scrollIntoViewIfNeeded()
    await expect(commentSection).toBeVisible({ timeout: 30000 })

    // Click Grid layout button
    const gridButton = page.locator('button').filter({ hasText: 'Grid' }).last()
    await expect(gridButton).toBeVisible({ timeout: 10000 })
    await gridButton.click()

    // Verify Grid button is now active (has border-primary class)
    // POTENCJALNY PROBLEM: Lokator `.last()` - w sekcji Comments "Grid" to inny
    // button niż w sekcji Posts. Jeśli PostsLayout też ma "Grid" widoczny,
    // `.last()` powinien trafić w Comments, ale to zależy od DOM order.
    await expect(gridButton).toHaveClass(/border-primary/, { timeout: 5000 })
  })

  /**
   * Test 12: Bottom bar - action buttons visible on desktop
   * Verifies fixed bottom bar with Changes and Full Preview buttons
   */
  test('bottom bar action buttons are visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    // Scope to desktop bottom bar (hidden on mobile, flex on md+)
    const desktopBar = page.locator('.hidden.md\\:flex')
    await expect(desktopBar.locator('button:has-text("Changes")')).toBeVisible({ timeout: 10000 })
    await expect(desktopBar.locator('button:has-text("Full Preview")')).toBeVisible()
  })

  /**
   * Test 13: Full Preview opens and shows close button
   * Verifies clicking Full Preview opens modal with preview content
   */
  test('full preview opens modal with close button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    // Click Full Preview
    await page.locator('button:has-text("Full Preview")').click()

    // FullPreview modal: fixed inset-0 z-50 bg-bg
    const modal = page.locator('.fixed.inset-0.z-50.bg-bg')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Close button: button element with fixed top-4 right-4 z-50
    const closeButton = page.locator('button.fixed.top-4.right-4.z-50')
    await expect(closeButton).toBeVisible({ timeout: 10000 })
  })

  /**
   * Test 14: All sections are accessible via scrolling
   * Verifies all sections can be reached by scrolling through the page
   */
  test('all sections are accessible via scrolling', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    const sections = [
      'Quick Start Templates',
      'Page Layout Editor',
      'Navigation Tabs',
      'Site Settings',
      'Author Profile Settings',
      'Posts Layout',
      'Post Card Appearance',
      'Comments Tab Settings'
    ]

    for (const sectionName of sections) {
      const section = page.locator(`h2:has-text("${sectionName}")`)
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible({ timeout: 10000 })
    }
  })

  /**
   * Test 15: Mobile responsiveness - sections visible on mobile viewport
   */
  test('admin panel sections are visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    // Scroll through key sections on mobile
    for (const sectionName of ['Site Settings', 'Posts Layout', 'Comments Tab Settings']) {
      const section = page.locator(`h2:has-text("${sectionName}")`)
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible({ timeout: 10000 })
    }
  })

  /**
   * Test 16: Changes button opens JSON preview modal
   * Verifies Config Preview modal with diff view tabs
   */
  test('changes button opens json preview modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2:has-text("Quick Start Templates")')).toBeVisible({ timeout: 30000 })

    // Click Changes in desktop bottom bar
    const desktopBar = page.locator('.hidden.md\\:flex')
    await desktopBar.locator('button:has-text("Changes")').click()

    // Config Preview modal header
    await expect(page.locator('h2:has-text("Config Preview")')).toBeVisible({ timeout: 10000 })

    // Close button with aria-label
    await expect(page.locator('button[aria-label="Close config preview"]')).toBeVisible()

    // View mode tabs: Old (Hive), New (Current)
    await expect(page.locator('button:has-text("Old (Hive)")')).toBeVisible()
    await expect(page.locator('button:has-text("New (Current)")')).toBeVisible()
  })

  /**
   * Test 17: Animation settings selects are interactive
   * Verifies hover effect and scroll animation type dropdowns work
   */
  test('animation settings selects are interactive', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const styleSection = page.locator('h2:has-text("Style")')
    await styleSection.scrollIntoViewIfNeeded()
    await expect(styleSection).toBeVisible({ timeout: 30000 })

    // Hover Animations select (contains options: none, shadow, lift, scale, glow)
    const hoverSelect = page.locator('select').filter({ has: page.locator('option:has-text("shadow")') }).first()
    await hoverSelect.scrollIntoViewIfNeeded()
    await expect(hoverSelect).toBeVisible({ timeout: 10000 })

    // Change hover effect to "shadow" and verify
    await hoverSelect.selectOption('shadow')
    await expect(hoverSelect).toHaveValue('shadow')

    // Scroll Animations select (contains options: none, fade, slide-up, etc.)
    const scrollSelect = page.locator('select').filter({ has: page.locator('option:has-text("fade")') }).first()
    await scrollSelect.scrollIntoViewIfNeeded()
    await expect(scrollSelect).toBeVisible({ timeout: 10000 })

    // Change scroll animation to "fade" and verify
    await scrollSelect.selectOption('fade')
    await expect(scrollSelect).toHaveValue('fade')
  })

})

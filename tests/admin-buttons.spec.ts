import { test, expect } from '@playwright/test'

test.describe('Admin Panel Buttons', () => {
  test.beforeEach(async ({ page }) => {
    // Zbieraj logi konsoli
    page.on('console', (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
    })

    // Przejdź do strony admin
    await page.goto('/admin')

    // Poczekaj na załadowanie SolidJS (komponent AdminPanel)
    await page.waitForSelector('text=Loading settings...', { state: 'hidden', timeout: 10000 })
  })

  test('strona admin ładuje się poprawnie', async ({ page }) => {
    // Sprawdź czy główne sekcje są widoczne
    await expect(page.locator('h2:has-text("Theme & Colors")')).toBeVisible()
    await expect(page.locator('button:has-text("Save All Settings")')).toBeVisible()
  })

  test('przyciski preset theme reagują na kliknięcia', async ({ page }) => {
    // Znajdź sekcję Theme & Colors
    const themeSection = page.locator('.bg-bg-card:has-text("Theme & Colors")')
    await expect(themeSection).toBeVisible()

    // Znajdź wszystkie karty presetów (nie Custom)
    const presetCards = themeSection.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("Green"), button:has-text("Pink"), button:has-text("Ocean"), button:has-text("Sunset"), button:has-text("Forest"), button:has-text("Lavender"), button:has-text("Midnight"), button:has-text("Coffee")')

    const count = await presetCards.count()
    console.log(`Found ${count} preset cards`)
    expect(count).toBeGreaterThan(0)

    // Pobierz początkowy kolor tła strony
    const getBodyBgColor = async () => {
      return await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim()
      })
    }

    const initialBgColor = await getBodyBgColor()
    console.log('Initial bg color:', initialBgColor)

    // Kliknij Dark preset i sprawdź czy zmienia się kolor tła
    const darkCard = themeSection.locator('button:has-text("Dark")')
    await darkCard.click()
    await page.waitForTimeout(500)

    const darkBgColor = await getBodyBgColor()
    console.log('Dark bg color:', darkBgColor)

    // Kolor powinien się zmienić (Dark ma inne kolory niż Light)
    expect(darkBgColor).not.toBe(initialBgColor)

    // Kliknij Green preset
    const greenCard = themeSection.locator('button:has-text("Green")')
    await greenCard.click()
    await page.waitForTimeout(500)

    const greenBgColor = await getBodyBgColor()
    console.log('Green bg color:', greenBgColor)

    // Kolor powinien się zmienić (Green ma inne kolory niż Dark)
    expect(greenBgColor).not.toBe(darkBgColor)
  })

  test('przycisk Custom otwiera dialog', async ({ page }) => {
    // Znajdź sekcję Theme & Colors
    const themeSection = page.locator('.bg-bg-card:has-text("Theme & Colors")')
    await expect(themeSection).toBeVisible()

    // Znajdź przycisk Custom
    const customButton = themeSection.locator('button:has-text("Custom")')
    await expect(customButton).toBeVisible()

    // Kliknij Custom
    console.log('Clicking Custom button...')
    await customButton.click()
    await page.waitForTimeout(500)

    // Dialog powinien być widoczny (szukamy tytułu dialogu)
    const dialog = page.locator('text=Customize Theme Colors')
    const isDialogVisible = await dialog.isVisible()
    console.log('Is dialog visible:', isDialogVisible)

    expect(isDialogVisible).toBe(true)
  })

  test('przycisk Save All Settings reaguje na kliknięcie', async ({ page }) => {
    // Znajdź przycisk Save
    const saveButton = page.locator('button:has-text("Save All Settings")')
    await expect(saveButton).toBeVisible()

    // Ustaw listener na requesty
    let saveRequestMade = false
    page.on('request', (request) => {
      if (request.url().includes('/api/admin/settings') && request.method() === 'PUT') {
        saveRequestMade = true
        console.log('Save request intercepted!')
      }
    })

    // Kliknij Save
    console.log('Clicking Save button...')
    await saveButton.click()
    await page.waitForTimeout(1000)

    // Sprawdź czy request został wysłany lub czy toast się pojawił
    const toast = page.locator('.fixed.bottom-4.right-4')
    const hasToast = await toast.isVisible().catch(() => false)
    console.log('Toast visible:', hasToast)
    console.log('Save request made:', saveRequestMade)

    // Przycisk powinien albo wysłać request albo pokazać toast
    expect(saveRequestMade || hasToast).toBe(true)
  })

  test('checkboxy reagują na kliknięcia', async ({ page }) => {
    // Znajdź pierwszy checkbox na stronie
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    console.log(`Found ${count} checkboxes`)

    if (count > 0) {
      const firstCheckbox = checkboxes.first()
      const initialState = await firstCheckbox.isChecked()
      console.log('Initial checkbox state:', initialState)

      // Kliknij checkbox
      await firstCheckbox.click()
      await page.waitForTimeout(200)

      const newState = await firstCheckbox.isChecked()
      console.log('New checkbox state:', newState)

      // Stan powinien się zmienić
      expect(newState).not.toBe(initialState)
    }
  })

  test('inputy tekstowe reagują na zmiany', async ({ page }) => {
    // Znajdź pierwszy input tekstowy
    const textInputs = page.locator('input[type="text"]')
    const count = await textInputs.count()
    console.log(`Found ${count} text inputs`)

    if (count > 0) {
      const firstInput = textInputs.first()
      const initialValue = await firstInput.inputValue()
      console.log('Initial input value:', initialValue)

      // Wyczyść i wpisz nową wartość
      await firstInput.fill('test-value-123')
      await page.waitForTimeout(200)

      const newValue = await firstInput.inputValue()
      console.log('New input value:', newValue)

      expect(newValue).toBe('test-value-123')
    }
  })
})

test.describe('Test Buttons Page', () => {
  test('native HTML button działa', async ({ page }) => {
    await page.goto('/test-buttons')

    // Ustaw listener na alerty
    let alertShown = false
    page.on('dialog', async (dialog) => {
      alertShown = true
      console.log('Alert message:', dialog.message())
      await dialog.accept()
    })

    // Kliknij native button
    await page.click('button:has-text("Kliknij mnie (native)")')
    await page.waitForTimeout(200)

    expect(alertShown).toBe(true)
  })

  test('SolidJS button z onClick działa', async ({ page }) => {
    let consoleLogFound = false
    page.on('console', (msg) => {
      if (msg.text().includes('SolidJS button clicked')) {
        consoleLogFound = true
      }
    })

    await page.goto('/test-buttons')
    await page.waitForTimeout(1000) // Poczekaj na hydration

    // Kliknij SolidJS button
    await page.click('button:has-text("Kliknij mnie (SolidJS)")')
    await page.waitForTimeout(500)

    console.log('SolidJS button console log found:', consoleLogFound)
    expect(consoleLogFound).toBe(true)
  })

  test('SolidJS button z alertem działa', async ({ page }) => {
    let alertShown = false
    page.on('dialog', async (dialog) => {
      alertShown = true
      console.log('Alert message:', dialog.message())
      await dialog.accept()
    })

    await page.goto('/test-buttons')
    await page.waitForTimeout(1000) // Poczekaj na hydration

    // Kliknij SolidJS button z alertem
    await page.click('button:has-text("Kliknij mnie (alert)")')
    await page.waitForTimeout(500)

    console.log('SolidJS alert button worked:', alertShown)
    expect(alertShown).toBe(true)
  })

  test('wszystkie warianty przycisków działają', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      consoleLogs.push(msg.text())
    })

    await page.goto('/test-buttons')
    await page.waitForTimeout(1000) // Poczekaj na hydration

    // Kliknij każdy wariant
    await page.click('button:has-text("Primary")')
    await page.waitForTimeout(200)
    await page.click('button:has-text("Secondary")')
    await page.waitForTimeout(200)
    await page.click('button:has-text("Accent")')
    await page.waitForTimeout(200)
    await page.click('button:has-text("Ghost")')
    await page.waitForTimeout(200)

    console.log('Console logs:', consoleLogs)

    // Sprawdź czy wszystkie warianty wywołały console.log
    expect(consoleLogs.some((log) => log.includes('Primary clicked'))).toBe(true)
    expect(consoleLogs.some((log) => log.includes('Secondary clicked'))).toBe(true)
    expect(consoleLogs.some((log) => log.includes('Accent clicked'))).toBe(true)
    expect(consoleLogs.some((log) => log.includes('Ghost clicked'))).toBe(true)
  })
})

import { test, expect } from "@playwright/test";

/**
 * Community Mode - Admin Panel Tests
 *
 * These tests run against a dev server with HIVE_USERNAME=hive-123456 (port 4327).
 * Community admin panel has:
 * - Tab navigation: Design | Community
 * - Community tab: CommunitySettings + CommunityInfo
 * - CommunityDisplaySettings in Design tab (enabled in community mode)
 */

// SolidJS hydration + HB-Auth init takes time
test.setTimeout(60000);

test.describe("Community Admin Panel", () => {
  test("admin page loads and shows tab navigation", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Wait for SolidJS hydration
    const h1 = page.locator('h1:has-text("Admin Panel")');
    await expect(h1).toBeVisible({ timeout: 30000 });

    // In community mode, admin panel shows Design | Community tabs
    const design_tab = page.locator('button:has-text("Design")');
    const community_tab = page.locator('button:has-text("Community")');

    await expect(design_tab).toBeVisible({ timeout: 30000 });
    await expect(community_tab).toBeVisible();
  });

  test("Design tab is active by default", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Wait for tabs to appear
    const design_tab = page.locator('button:has-text("Design")');
    await expect(design_tab).toBeVisible({ timeout: 30000 });

    // Design tab should have active indicator
    const active_indicator = design_tab.locator("span.bg-primary");
    await expect(active_indicator).toBeVisible();

    // Design tab content should be visible (Quick Start Templates is first section)
    const template_section = page.locator(
      'h2:has-text("Quick Start Templates")'
    );
    await expect(template_section).toBeVisible({ timeout: 15000 });
  });

  test("clicking Community tab shows community sections", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Wait for hydration
    const community_tab = page.locator('button:has-text("Community")');
    await expect(community_tab).toBeVisible({ timeout: 30000 });

    // Click Community tab
    await community_tab.click();

    // Community Settings section should appear
    const community_settings_heading = page.locator(
      'h2:has-text("Community Settings")'
    );
    await expect(community_settings_heading).toBeVisible({ timeout: 15000 });

    // Community Info section should appear
    const community_info_heading = page.locator(
      'h2:has-text("Community Info")'
    );
    await expect(community_info_heading).toBeVisible({ timeout: 15000 });
  });

  test("Community Settings form fields are present", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const community_tab = page.locator('button:has-text("Community")');
    await expect(community_tab).toBeVisible({ timeout: 30000 });
    await community_tab.click();

    // Wait for CommunitySettings section
    const settings_section = page.locator(
      'h2:has-text("Community Settings")'
    );
    await expect(settings_section).toBeVisible({ timeout: 15000 });

    // Title input
    const title_input = page.locator(
      'input[placeholder="Community title"]'
    );
    await expect(title_input).toBeVisible({ timeout: 15000 });

    // About input
    const about_input = page.locator(
      'input[placeholder="Brief description of the community"]'
    );
    await expect(about_input).toBeVisible();

    // Description textarea
    const description_textarea = page.locator(
      'textarea[placeholder="Detailed community description..."]'
    );
    await expect(description_textarea).toBeVisible();

    // Rules textarea
    const rules_textarea = page.locator(
      'textarea[placeholder="Community rules and posting guidelines..."]'
    );
    await expect(rules_textarea).toBeVisible();

    // Language select
    const lang_select = page.locator("select").first();
    await expect(lang_select).toBeVisible();

    // NSFW checkbox
    const nsfw_checkbox = page.locator("#community-nsfw");
    await expect(nsfw_checkbox).toBeVisible();
  });

  test("Community Info shows stats and team roles", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const community_tab = page.locator('button:has-text("Community")');
    await expect(community_tab).toBeVisible({ timeout: 30000 });
    await community_tab.click();

    // Wait for Community Info section
    const info_heading = page.locator('h2:has-text("Community Info")');
    await expect(info_heading).toBeVisible({ timeout: 15000 });

    // Stats cards (Subscribers, Authors, Pending Posts, Pending Payout)
    const subscribers_label = page.locator('text="Subscribers"');
    await expect(subscribers_label).toBeVisible({ timeout: 15000 });

    const authors_label = page.locator('text="Authors"');
    await expect(authors_label).toBeVisible();

    // Team & Roles heading
    const team_heading = page.locator('text="Team & Roles"');
    await expect(team_heading).toBeVisible();

    // Roles table should have at least one row
    const role_rows = page.locator("table tbody tr");
    await expect(role_rows.first()).toBeVisible({ timeout: 15000 });
  });

  test("Community Info Subscribers section is expandable", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const community_tab = page.locator('button:has-text("Community")');
    await expect(community_tab).toBeVisible({ timeout: 30000 });
    await community_tab.click();

    const info_heading = page.locator('h2:has-text("Community Info")');
    await expect(info_heading).toBeVisible({ timeout: 15000 });

    // "Subscribers" expand button
    const subscribers_button = page.locator(
      'button:has-text("Subscribers")'
    );
    await subscribers_button.scrollIntoViewIfNeeded();
    await expect(subscribers_button).toBeVisible({ timeout: 10000 });

    // Click to expand
    await subscribers_button.click();

    // After expanding, subscriber table or "Loading subscribers..." should appear
    const subscriber_content = page.locator(
      "table:below(button:has-text('Subscribers'))"
    );
    const loading_text = page.locator('text="Loading subscribers..."');

    // Wait for either table or loading indicator
    await expect(
      subscriber_content.first().or(loading_text)
    ).toBeVisible({ timeout: 10000 });
  });

  test("CommunityDisplaySettings is enabled in Design tab", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Design tab should be active by default
    const display_settings = page.locator(
      'h2:has-text("Community Display Settings")'
    );
    await display_settings.scrollIntoViewIfNeeded();
    await expect(display_settings).toBeVisible({ timeout: 30000 });

    // In community mode, it should NOT have the "Community only" disabled banner
    const disabled_banner = page.locator('text="Community only"');
    await expect(disabled_banner).not.toBeVisible();

    // The Default Sort Order select should be interactive (not disabled)
    const sort_select = display_settings
      .locator("xpath=following::select[1]");
    await expect(sort_select).toBeVisible();
    await expect(sort_select).not.toBeDisabled();
  });

  test("switching tabs preserves tab state", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const community_tab = page.locator('button:has-text("Community")');
    const design_tab = page.locator('button:has-text("Design")');
    await expect(community_tab).toBeVisible({ timeout: 30000 });

    // Switch to Community tab
    await community_tab.click();
    await expect(
      page.locator('h2:has-text("Community Settings")')
    ).toBeVisible({ timeout: 15000 });

    // Design tab content should be hidden
    await expect(
      page.locator('h2:has-text("Quick Start Templates")')
    ).not.toBeVisible();

    // Switch back to Design
    await design_tab.click();
    await expect(
      page.locator('h2:has-text("Quick Start Templates")')
    ).toBeVisible({ timeout: 15000 });

    // Community content should be hidden
    await expect(
      page.locator('h2:has-text("Community Settings")')
    ).not.toBeVisible();
  });
});

/**
 * Community Mode - Full Preview Tests
 *
 * Tests for the Full Preview overlay in community mode.
 * Full Preview is rendered in a <Portal> (directly in document body),
 * fetches community posts from Hive, and displays them using current settings.
 */

test.describe("Community Full Preview", () => {
  test.setTimeout(60000);

  test("Full Preview opens and shows community title in badge", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Wait for SolidJS hydration
    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({
      timeout: 30000,
    });

    // Click "Full Preview" button in the bottom bar (desktop variant)
    const full_preview_btn = page.locator('button:has-text("Full Preview")');
    await full_preview_btn.click();

    // Badge is rendered in Portal with class bg-primary, text starts with "Preview Mode"
    const preview_badge = page.locator(".bg-primary").filter({
      hasText: "Preview Mode",
    });
    await expect(preview_badge).toBeVisible({ timeout: 15000 });

    // In community mode the badge should NOT contain "no user"
    const badge_text = await preview_badge.textContent();
    expect(badge_text).not.toContain("no user");

    // Badge should contain a community name (non-empty text after "Preview Mode - ")
    const name_part = badge_text?.replace("Preview Mode - ", "") ?? "";
    expect(name_part.trim().length).toBeGreaterThan(0);
  });

  test("Full Preview shows community posts", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({
      timeout: 30000,
    });

    const full_preview_btn = page.locator('button:has-text("Full Preview")');
    await full_preview_btn.click();

    // Wait for loading spinner to disappear (spinner has animate-spin class)
    await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 30000 });

    // Posts are rendered as <article> elements inside the Portal overlay
    const post_cards = page.locator("article.bg-bg-card");
    await expect(post_cards.first()).toBeVisible({ timeout: 15000 });

    // Should have at least 1 post
    const post_count = await post_cards.count();
    expect(post_count).toBeGreaterThanOrEqual(1);
  });

  test("Full Preview header shows community name, not Hive Blog", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({
      timeout: 30000,
    });

    const full_preview_btn = page.locator('button:has-text("Full Preview")');
    await full_preview_btn.click();

    // Wait for data to load (spinner gone, content visible)
    await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 30000 });

    // Header is rendered inside the Portal overlay's <header> element
    // The overlay is .fixed.inset-0 containing the preview content
    const preview_overlay = page.locator(".fixed.inset-0");
    const header_el = preview_overlay.locator("header").first();
    await expect(header_el).toBeVisible({ timeout: 15000 });

    const header_text = await header_el.textContent();

    // In community mode the header should NOT show "Hive Blog" (user mode default)
    expect(header_text).not.toBe("Hive Blog");

    // Header text should not be empty
    expect((header_text ?? "").trim().length).toBeGreaterThan(0);
  });

  test("Full Preview closes on X button click", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({
      timeout: 30000,
    });

    const full_preview_btn = page.locator('button:has-text("Full Preview")');
    await full_preview_btn.click();

    // Verify the overlay is visible
    const preview_overlay = page.locator(".fixed.inset-0");
    await expect(preview_overlay).toBeVisible({ timeout: 15000 });

    // Click close button inside the preview overlay (top-right, fixed position)
    const close_btn = preview_overlay.locator("button").first();
    await close_btn.click();

    // The Portal overlay should disappear
    await expect(preview_overlay).toBeHidden({ timeout: 10000 });
  });
});

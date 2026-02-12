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

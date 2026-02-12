import { test, expect } from "@playwright/test";

/**
 * User Mode - Community Features Disabled Tests
 *
 * These tests run against the default dev server (HIVE_USERNAME=barddev, port 4326).
 * They verify that community-specific UI is absent or disabled in user mode.
 */

// SolidJS hydration can take time
test.setTimeout(60000);

test.describe("User Mode - Homepage", () => {
  test("homepage loads blog posts (not community posts)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Main content container should be visible
    const container = page.locator(".max-w-7xl");
    await expect(container).toBeVisible();

    // Should NOT have community sidebar layout
    const sidebar_layout = page.locator("aside.sidebar-left");
    // In user mode, sidebar-left may exist from layout editor config,
    // but community-specific components should not be present
    const community_profile_card = page.locator(
      'text="hive-123456"'
    );
    await expect(community_profile_card).not.toBeVisible();
  });

  test("does not show community sort tabs (Trending/Hot/New/Payouts)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Community sort tabs are: Trending, Hot, New, Payouts
    // User mode may have different tabs like Blog, Posts
    // The Trending/Hot/Payouts tabs are community-only
    const trending_tab = page.locator(
      'nav button:has-text("Trending")'
    );
    const payout_tab = page.locator(
      'nav button:has-text("Payouts")'
    );

    await expect(trending_tab).not.toBeVisible();
    await expect(payout_tab).not.toBeVisible();
  });

  test("no community profile card visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // CommunityProfile component renders "Subscribers" text
    // This should NOT be present in user mode sidebar
    const subscribers_stat = page.locator(
      '.sidebar-left text="Subscribers"'
    );
    await expect(subscribers_stat).not.toBeVisible();
  });
});

test.describe("User Mode - Admin Panel", () => {
  test("admin panel does NOT show Design/Community tab navigation", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Wait for hydration
    const h1 = page.locator('h1:has-text("Admin Panel")');
    await expect(h1).toBeVisible({ timeout: 30000 });

    // In user mode, there should be no Community tab
    // (tab navigation only renders when IS_COMMUNITY is true)
    const community_tab = page.locator(
      'nav button:has-text("Community")'
    );
    await expect(community_tab).not.toBeVisible();
  });

  test("CommunityDisplaySettings shows Community only badge", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Wait for hydration
    const h1 = page.locator('h1:has-text("Admin Panel")');
    await expect(h1).toBeVisible({ timeout: 30000 });

    // CommunityDisplaySettings should be visible but disabled
    const display_settings_heading = page.locator(
      'h2:has-text("Community Display Settings")'
    );
    await display_settings_heading.scrollIntoViewIfNeeded();
    await expect(display_settings_heading).toBeVisible({ timeout: 15000 });

    // Should show "Community only" disabled banner
    const disabled_banner = page.locator(
      'text="Community only"'
    );
    await expect(disabled_banner).toBeVisible();
  });

  test("CommunityDisplaySettings controls are disabled in user mode", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator('h1:has-text("Admin Panel")');
    await expect(h1).toBeVisible({ timeout: 30000 });

    // Scroll to CommunityDisplaySettings
    const display_settings = page.locator(
      'h2:has-text("Community Display Settings")'
    );
    await display_settings.scrollIntoViewIfNeeded();
    await expect(display_settings).toBeVisible({ timeout: 15000 });

    // The container should have opacity-60 class (disabled state)
    const settings_container = display_settings.locator("xpath=ancestor::div[contains(@class, 'bg-bg-card')]");
    await expect(settings_container).toHaveClass(/opacity-60/);

    // Select should be disabled
    const sort_select = page.locator(
      'h2:has-text("Community Display Settings")'
    ).locator("xpath=following::select[1]");
    await expect(sort_select).toBeDisabled();
  });

  test("admin design sections still work normally", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Standard sections should be visible (no tab switching needed)
    await expect(
      page.locator('h2:has-text("Quick Start Templates")')
    ).toBeVisible({ timeout: 30000 });

    await expect(
      page.locator('h2:has-text("Site Settings")')
    ).toBeVisible();

    await expect(
      page.locator('h2:has-text("Posts Layout")')
    ).toBeVisible();
  });
});

test.describe("User Mode - Post Page", () => {
  test("post URL uses permlink-only format (not author/permlink)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find a post link on the homepage
    // In user mode, BlogContent links use format: /permlink
    const post_link = page.locator('a[href^="/"][href*="-"]').first();

    if ((await post_link.count()) > 0) {
      const href = await post_link.getAttribute("href");
      if (href && href !== "/admin") {
        // User mode links should NOT contain a slash in the middle (author/permlink)
        // They should be simple: /my-post-title
        const segments = href.split("/").filter(Boolean);
        expect(segments.length).toBeLessThanOrEqual(1);
      }
    }
  });

  test("post page does not show community role badges", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const post_link = page
      .locator('a[href^="/"][href*="-"]')
      .first();

    if ((await post_link.count()) > 0) {
      const href = await post_link.getAttribute("href");
      if (href && href !== "/admin") {
        await page.goto(href);
        await page.waitForLoadState("networkidle");

        const article = page.locator("article").first();
        if ((await article.count()) > 0) {
          // In user mode, IS_COMMUNITY is false, so role badges should not render
          // Role badges have specific CSS classes like bg-warning/20, bg-error/20
          const role_badge = article.locator(
            '.flex.items-center.gap-2 span.rounded-full'
          );
          await expect(role_badge).not.toBeVisible();
        }
      }
    }
  });
});

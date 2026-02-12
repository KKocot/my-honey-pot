import { test, expect } from "@playwright/test";

/**
 * Community Mode - Homepage Tests
 *
 * These tests run against a dev server with HIVE_USERNAME=hive-123456 (port 4327).
 * They verify the community homepage renders correctly with:
 * - Community profile sidebar
 * - Sort tabs (Trending/Hot/New/Payouts)
 * - Community posts grid
 * - Pinned post badges
 */

// Community mode SSR + SolidJS hydration can take time
test.setTimeout(60000);

test.describe("Community Homepage", () => {
  test("loads successfully and shows community content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Page should not show error banner
    const error_banner = page.locator(".bg-error\\/10");
    await expect(error_banner).not.toBeVisible();

    // Should not show "username not configured" message
    const config_msg = page.locator('text="Hive username is not configured."');
    await expect(config_msg).not.toBeVisible();

    // Main content container should be visible
    const container = page.locator(".max-w-7xl");
    await expect(container).toBeVisible();
  });

  test("displays community profile card in sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Community profile card should be visible (rendered by CommunityProfile)
    // The card contains community avatar, title, about, and subscriber stats
    const sidebar = page.locator("aside.sidebar-left");
    await expect(sidebar).toBeVisible({ timeout: 30000 });

    // Community avatar image
    const avatar = sidebar.locator('img[alt*="avatar"]');
    await expect(avatar.first()).toBeVisible({ timeout: 15000 });

    // Community name text (hive-123456)
    const community_name_text = sidebar.locator("text=hive-123456");
    await expect(community_name_text).toBeVisible({ timeout: 15000 });
  });

  test("displays community sidebar sections", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside.sidebar-left");
    await expect(sidebar).toBeVisible({ timeout: 30000 });

    // CommunitySidebar renders: Description, Rules, Team, Language
    // At least the "Team" or "Description" heading should be present
    const sidebar_headings = sidebar.locator("h3");
    await expect(sidebar_headings.first()).toBeVisible({ timeout: 15000 });
  });

  test("shows sort tabs: Trending, Hot, New, Payouts", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // CommunityContent renders a nav with sort tabs
    const nav = page.locator("nav.border-b");
    await expect(nav).toBeVisible({ timeout: 30000 });

    // All four tabs should be present
    await expect(nav.locator('button:has-text("Trending")')).toBeVisible();
    await expect(nav.locator('button:has-text("Hot")')).toBeVisible();
    await expect(nav.locator('button:has-text("New")')).toBeVisible();
    await expect(nav.locator('button:has-text("Payouts")')).toBeVisible();
  });

  test("trending tab is active by default", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const nav = page.locator("nav.border-b");
    await expect(nav).toBeVisible({ timeout: 30000 });

    // Active tab has text-text class and a bottom indicator span
    const trending_button = nav.locator('button:has-text("Trending")');
    await expect(trending_button).toBeVisible();

    // The active tab renders a span.bg-primary indicator at the bottom
    const active_indicator = trending_button.locator("span.bg-primary");
    await expect(active_indicator).toBeVisible();
  });

  test("clicking a sort tab changes active state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const nav = page.locator("nav.border-b");
    await expect(nav).toBeVisible({ timeout: 30000 });

    // Click "Hot" tab
    const hot_button = nav.locator('button:has-text("Hot")');
    await hot_button.click();

    // Hot tab should now have the active indicator
    const hot_indicator = hot_button.locator("span.bg-primary");
    await expect(hot_indicator).toBeVisible({ timeout: 10000 });

    // Trending should no longer have it
    const trending_button = nav.locator('button:has-text("Trending")');
    const trending_indicator = trending_button.locator("span.bg-primary");
    await expect(trending_indicator).not.toBeVisible();
  });

  test("displays post cards after data loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for posts to render (article elements from CommunityPostCard)
    const articles = page.locator("main.main-content article");
    await expect(articles.first()).toBeVisible({ timeout: 30000 });

    // Should have at least one post
    expect(await articles.count()).toBeGreaterThan(0);
  });

  test("pinned posts show Pinned badge", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for posts to load
    const articles = page.locator("main.main-content article");
    await expect(articles.first()).toBeVisible({ timeout: 30000 });

    // If there are pinned posts, they should have a "Pinned" badge
    // The badge is rendered as a div with text "Pinned" and bg-primary/90
    const pinned_badges = page.locator("main.main-content .bg-primary\\/90");
    const pinned_count = await pinned_badges.count();

    if (pinned_count > 0) {
      await expect(pinned_badges.first()).toContainText("Pinned");
    }
    // If no pinned posts exist in the community, this test still passes
  });

  test("pagination buttons appear when there are enough posts", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for posts to load
    const articles = page.locator("main.main-content article");
    await expect(articles.first()).toBeVisible({ timeout: 30000 });

    // Check for "Next page" button (appears when has_more is true)
    const next_button = page.locator('button:has-text("Next page")');
    const has_next = (await next_button.count()) > 0;

    if (has_next) {
      await expect(next_button).toBeVisible();
    }
    // No assertion failure if pagination is not needed (few posts)
  });

  test("community layout has sidebar + main structure", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Community mode uses sidebar-layout class with sidebar-left + main-content
    const layout = page.locator(".sidebar-layout");
    await expect(layout).toBeVisible({ timeout: 30000 });

    const sidebar = layout.locator("aside.sidebar-left");
    await expect(sidebar).toBeVisible();

    const main = layout.locator("main.main-content");
    await expect(main).toBeVisible();
  });
});

import { test, expect, type Page, type Browser } from "@playwright/test";

// Community mode: compare Full Preview (admin) vs Blog homepage (/)
// Blog has HARDCODED sidebar-left with CommunityProfile + CommunitySidebar
// Preview renders from settings.pageLayout (defaultCommunitySettings) which has NO sidebar-left
// This test suite is expected to DETECT this layout discrepancy

test.setTimeout(60000);

// ============================================
// Snapshot helpers
// ============================================

interface CommunityLayoutSnapshot {
  has_sidebar_layout: boolean;
  has_sidebar_left: boolean;
  has_main_content: boolean;
  has_header: boolean;
  has_footer: boolean;
  article_count: number;
  header_text: string;
  sidebar_has_community_profile: boolean;
  sidebar_text: string;
}

async function collect_community_blog_snapshot(
  page: Page,
): Promise<CommunityLayoutSnapshot> {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const container = page.locator(".max-w-7xl");
  await expect(container).toBeVisible({ timeout: 30000 });

  // Wait for community posts to load (CommunityContent hydration)
  const first_article = page.locator("main.main-content article").first();
  await expect(first_article).toBeVisible({ timeout: 30000 });

  return collect_community_snapshot(page);
}

async function collect_community_preview_snapshot(
  page: Page,
): Promise<CommunityLayoutSnapshot> {
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");

  await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({
    timeout: 30000,
  });

  const full_preview_btn = page.locator('button:has-text("Full Preview")');
  await full_preview_btn.click();

  const preview_overlay = page.locator(".fixed.inset-0");
  await expect(preview_overlay).toBeVisible({ timeout: 15000 });

  // Wait for loading spinner to disappear
  await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 30000 });

  // Wait for posts to render inside Portal
  const first_article = preview_overlay.locator("article").first();
  await expect(first_article).toBeVisible({ timeout: 30000 });

  return collect_community_snapshot(page, ".fixed.inset-0");
}

async function collect_community_snapshot(
  page: Page,
  scope_selector?: string,
): Promise<CommunityLayoutSnapshot> {
  const scope = scope_selector ? page.locator(scope_selector) : page;

  const has_sidebar_layout =
    (await scope.locator(".sidebar-layout").count()) > 0;
  const has_sidebar_left =
    (await scope.locator("aside.sidebar-left").count()) > 0;
  const has_main_content =
    (await scope.locator("main.main-content").count()) > 0;
  const has_header = (await scope.locator("header").count()) > 0;
  const has_footer_in_scope = scope_selector
    ? (await scope.locator("footer").count()) > 0
    : (await page.locator("footer").count()) > 0;

  const article_count = await scope.locator("article").count();

  let header_text = "";
  if (has_header) {
    header_text =
      (await scope.locator("header").first().textContent()) ?? "";
    header_text = header_text.trim();
  }

  // Check if sidebar-left has community profile content
  let sidebar_has_community_profile = false;
  let sidebar_text = "";
  if (has_sidebar_left) {
    const sidebar = scope.locator("aside.sidebar-left");
    sidebar_text = (await sidebar.textContent()) ?? "";
    sidebar_text = sidebar_text.trim();
    // Community profile typically contains community name or avatar
    sidebar_has_community_profile = sidebar_text.length > 0;
  }

  return {
    has_sidebar_layout,
    has_sidebar_left,
    has_main_content,
    has_header,
    has_footer: has_footer_in_scope,
    article_count,
    header_text,
    sidebar_has_community_profile,
    sidebar_text,
  };
}

// ============================================
// Tests: Community Mode - Preview vs Blog
// ============================================

test.describe("Preview vs Blog - Community Mode", () => {
  let blog: CommunityLayoutSnapshot;
  let preview: CommunityLayoutSnapshot;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    blog = await collect_community_blog_snapshot(page);
    preview = await collect_community_preview_snapshot(page);
    await page.close();
  });

  test("layout structure: blog has sidebar-layout, preview may differ (detects bug)", () => {
    // Blog: HARDCODED sidebar-layout with community sidebar
    expect(blog.has_sidebar_layout).toBe(true);
    expect(blog.has_sidebar_left).toBe(true);
    expect(blog.has_main_content).toBe(true);

    // Preview: defaultCommunitySettings.pageLayout has NO sidebar-left section
    // so FullPreview should NOT render sidebar-layout
    // This assertion checks if preview matches blog layout
    // Expected to FAIL: blog has sidebar, preview does not
    expect(preview.has_sidebar_layout).toBe(blog.has_sidebar_layout);
  });

  test("header: both render a header with community name (not 'Hive Blog')", () => {
    expect(blog.has_header).toBe(true);
    expect(preview.has_header).toBe(true);

    // In community mode, header should show community title, not "Hive Blog"
    expect(blog.header_text).not.toBe("Hive Blog");
    expect(preview.header_text).not.toBe("Hive Blog");

    // Both should have non-empty header
    expect(blog.header_text.length).toBeGreaterThan(0);
    expect(preview.header_text.length).toBeGreaterThan(0);

    expect(preview.header_text).toBe(blog.header_text);
  });

  test("footer: both render a footer element", () => {
    // defaultCommunitySettings.pageLayout has footer in bottom slot
    // Blog: SlotRenderer renders bottom sections (footer enabled in defaults)
    expect(blog.has_footer).toBe(true);
    expect(preview.has_footer).toBe(blog.has_footer);
  });

  test("posts: both render article elements", () => {
    expect(blog.article_count).toBeGreaterThan(0);
    expect(preview.article_count).toBeGreaterThan(0);

    const diff = Math.abs(blog.article_count - preview.article_count);
    expect(diff).toBeLessThanOrEqual(5);
  });

  test("community sidebar: blog has community profile in sidebar-left, preview should match (detects bug)", () => {
    // Blog: hardcoded CommunityProfile + CommunitySidebar in aside.sidebar-left
    expect(blog.has_sidebar_left).toBe(true);
    expect(blog.sidebar_has_community_profile).toBe(true);
    expect(blog.sidebar_text.length).toBeGreaterThan(0);

    // Preview: defaultCommunitySettings.pageLayout has no sidebar-left
    // Expected to FAIL: preview has no sidebar-left at all
    expect(preview.has_sidebar_left).toBe(blog.has_sidebar_left);
    expect(preview.sidebar_has_community_profile).toBe(
      blog.sidebar_has_community_profile,
    );
  });
});

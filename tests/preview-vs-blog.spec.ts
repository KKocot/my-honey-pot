import { test, expect, type Page, type Browser } from "@playwright/test";

// User mode: compare Full Preview (admin) vs Blog homepage (/)
// Both should render identically when using default settings (no saved config)

test.setTimeout(60000);

// ============================================
// Snapshot helpers
// ============================================

interface LayoutSnapshot {
  has_sidebar_layout: boolean;
  has_sidebar_left: boolean;
  has_main_content: boolean;
  has_header: boolean;
  has_footer: boolean;
  article_count: number;
  header_text: string;
  body_bg_color: string;
  sidebar_text: string;
}

async function collect_blog_snapshot(page: Page): Promise<LayoutSnapshot> {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const container = page.locator(".max-w-7xl");
  await expect(container).toBeVisible({ timeout: 30000 });

  // Wait for SolidJS hydration (BlogContent renders articles)
  const first_article = page.locator("article").first();
  await expect(first_article).toBeVisible({ timeout: 30000 });

  return collect_snapshot(page);
}

async function collect_preview_snapshot(page: Page): Promise<LayoutSnapshot> {
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

  // Wait for data to render (articles inside Portal)
  const first_article = preview_overlay.locator("article").first();
  await expect(first_article).toBeVisible({ timeout: 30000 });

  // Collect snapshot scoped to the preview overlay
  return collect_snapshot(page, ".fixed.inset-0");
}

async function collect_snapshot(
  page: Page,
  scope_selector?: string,
): Promise<LayoutSnapshot> {
  const scope = scope_selector ? page.locator(scope_selector) : page;

  const has_sidebar_layout = (await scope.locator(".sidebar-layout").count()) > 0;
  const has_sidebar_left = (await scope.locator("aside.sidebar-left").count()) > 0;
  const has_main_content = (await scope.locator("main.main-content").count()) > 0;
  const has_header = (await scope.locator("header").count()) > 0;
  const has_footer_in_scope =
    scope_selector
      ? (await scope.locator("footer").count()) > 0
      : (await page.locator("footer").count()) > 0;

  const article_count = await scope.locator("article").count();

  let header_text = "";
  if (has_header) {
    header_text =
      (await scope.locator("header").first().textContent()) ?? "";
    header_text = header_text.trim();
  }

  let sidebar_text = "";
  if (has_sidebar_left) {
    const sidebar = scope.locator("aside.sidebar-left");
    sidebar_text = (await sidebar.textContent()) ?? "";
    sidebar_text = sidebar_text.trim();
  }

  const body_bg_color = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });

  return {
    has_sidebar_layout,
    has_sidebar_left,
    has_main_content,
    has_header,
    has_footer: has_footer_in_scope,
    article_count,
    header_text,
    body_bg_color,
    sidebar_text,
  };
}

// ============================================
// Tests: User Mode - Preview vs Blog
// ============================================

test.describe("Preview vs Blog - User Mode", () => {
  let blog: LayoutSnapshot;
  let preview: LayoutSnapshot;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    blog = await collect_blog_snapshot(page);
    preview = await collect_preview_snapshot(page);
    await page.close();
  });

  test("layout structure matches: sidebar-layout, sidebar-left, main-content", () => {
    expect(blog.has_sidebar_layout).toBe(true);
    expect(preview.has_sidebar_layout).toBe(blog.has_sidebar_layout);

    expect(blog.has_sidebar_left).toBe(true);
    expect(preview.has_sidebar_left).toBe(blog.has_sidebar_left);

    expect(blog.has_main_content).toBe(true);
    expect(preview.has_main_content).toBe(blog.has_main_content);
  });

  test("header element is present in both views", () => {
    expect(blog.has_header).toBe(true);
    expect(preview.has_header).toBe(true);

    // Both should contain the site name (non-empty header text)
    expect(blog.header_text.length).toBeGreaterThan(0);
    expect(preview.header_text.length).toBeGreaterThan(0);

    expect(preview.header_text).toBe(blog.header_text);
  });

  test("footer element is present in both views", () => {
    // Default pageLayout.sections has footer in bottom slot with active=true
    // (note: legacy layoutSections has footer enabled=false, but pageLayout takes priority in index.astro)
    expect(blog.has_footer).toBe(true);
    expect(preview.has_footer).toBe(blog.has_footer);
  });

  test("posts section renders article elements in both views", () => {
    expect(blog.article_count).toBeGreaterThan(0);
    expect(preview.article_count).toBeGreaterThan(0);
  });

  test("post cards count: both render the same number of posts (or both > 0)", () => {
    // Both should have posts, count may differ due to pagination/reblog filtering
    // but both should be > 0
    expect(blog.article_count).toBeGreaterThan(0);
    expect(preview.article_count).toBeGreaterThan(0);

    // If both use same postsPerPage (20), counts should be close
    // Allow some tolerance for reblog filtering differences
    const diff = Math.abs(blog.article_count - preview.article_count);
    expect(diff).toBeLessThanOrEqual(5);
  });

  test("author profile is present in sidebar-left in both views", () => {
    // Blog: default user layout has authorProfile in sidebar-left
    expect(blog.has_sidebar_left).toBe(true);
    expect((blog.sidebar_text).length).toBeGreaterThan(0);

    // Preview: should also have sidebar-left with profile content
    expect(preview.has_sidebar_left).toBe(true);
    expect((preview.sidebar_text).length).toBeGreaterThan(0);
  });

  test("theme CSS variables: background-color on body is consistent", () => {
    // Both should use the same theme (default: light)
    // Background color should match
    expect(preview.body_bg_color).toBe(blog.body_bg_color);
  });
});

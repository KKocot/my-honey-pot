// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Unified config loading pipeline
// ============================================
// Single function to load config from Hive blockchain,
// apply migrations, and merge with mode-specific defaults.
// Used by SSR (prepare_user_page, prepare_community_page)
// and client-side (admin queries.ts).

import {
  get_default_settings,
  strip_community_fields,
  type SettingsData,
  type PageLayout,
  ALL_PAGE_ELEMENT_IDS,
} from "../components/admin/types/index";
import { migrateCardLayout } from "../components/admin/types/layout";
import { load_raw_config_from_hive } from "../components/admin/hive-broadcast";

// ============================================
// Card layout migration (all 3 card types)
// ============================================

function migrate_card_layouts(
  raw: Partial<SettingsData>
): Partial<SettingsData> {
  const result: Partial<SettingsData> = {};

  const migrated_post = migrateCardLayout(raw.postCardLayout);
  if (migrated_post) {
    result.postCardLayout = migrated_post;
  }

  const migrated_comment = migrateCardLayout(raw.commentCardLayout);
  if (migrated_comment) {
    result.commentCardLayout = migrated_comment;
  }

  const migrated_author = migrateCardLayout(raw.authorProfileLayout2);
  if (migrated_author) {
    result.authorProfileLayout2 = migrated_author;
  }

  return result;
}

// ============================================
// Page layout migration (filter obsolete elements)
// ============================================

function migrate_page_layout(
  page_layout: PageLayout | undefined,
  defaults: SettingsData
): PageLayout {
  if (!page_layout) {
    return defaults.pageLayout;
  }

  const valid_element_ids = new Set(ALL_PAGE_ELEMENT_IDS);

  return {
    sections: page_layout.sections.map((section) => ({
      ...section,
      elements: section.elements.filter((el) => valid_element_ids.has(el)),
    })),
  };
}

// ============================================
// Merge raw config with mode-specific defaults
// ============================================

/**
 * Merge only the fields that were actually saved on blockchain
 * onto mode-specific defaults. This prevents Zod defaults
 * (e.g. postsLayout: "list") from overriding community defaults
 * (e.g. postsLayout: "grid") when the user never explicitly set that field.
 */
function merge_with_defaults(
  raw_fields: Partial<SettingsData>,
  defaults: SettingsData
): SettingsData {
  const final: SettingsData = { ...defaults };

  const raw_record: Record<string, unknown> = { ...raw_fields };

  for (const key of Object.keys(raw_fields)) {
    const value = raw_record[key];
    if (value !== undefined && value !== null) {
      Object.assign(final, { [key]: value });
    }
  }

  return final;
}

// ============================================
// Ensure complex layouts have valid fallbacks
// ============================================

/**
 * Intentionally mutates `settings` in place for performance --
 * called at the end of the pipeline on a freshly created object,
 * so mutation is safe (no shared references).
 */
function ensure_layout_fallbacks(
  settings: SettingsData,
  defaults: SettingsData
): void {
  if (!settings.layoutSections?.length) {
    settings.layoutSections = defaults.layoutSections;
  }
  if (!settings.postCardLayout?.sections?.length) {
    settings.postCardLayout = defaults.postCardLayout;
  }
  if (!settings.commentCardLayout?.sections?.length) {
    settings.commentCardLayout = defaults.commentCardLayout;
  }
  if (!settings.authorProfileLayout2?.sections?.length) {
    settings.authorProfileLayout2 = defaults.authorProfileLayout2;
  }
}

// ============================================
// Public API
// ============================================

/**
 * Load config from Hive and prepare it through the full pipeline:
 * 1. Load raw config (only fields actually saved on blockchain)
 * 2. Strip community fields in user mode
 * 3. Migrate card layouts (legacy -> new format)
 * 4. Migrate page layout (filter obsolete elements)
 * 5. Merge with mode-specific defaults (user or community)
 * 6. Ensure layout fallbacks
 *
 * @param username - Hive username or community name
 * @param is_community - Whether this is a community mode blog
 * @returns Full SettingsData with all fields populated
 */
export async function load_and_prepare_config(
  username: string,
  is_community: boolean
): Promise<SettingsData> {
  const defaults = get_default_settings(is_community);

  const raw_config = await load_raw_config_from_hive(username);

  if (!raw_config) {
    return { ...defaults, hiveUsername: username };
  }

  // Strip community fields when in user mode
  const cleaned = is_community
    ? raw_config
    : strip_community_fields(raw_config);

  // Migrate card layouts
  const migrated_cards = migrate_card_layouts(cleaned);

  // Merge raw config (without Zod defaults) with mode-specific defaults
  const merged = merge_with_defaults(cleaned, defaults);

  // Apply migrated card layouts on top (validated to exist)
  Object.assign(merged, migrated_cards);

  // Migrate page layout (filter obsolete elements)
  merged.pageLayout = migrate_page_layout(cleaned.pageLayout, defaults);

  // Ensure all complex layouts have valid structures
  ensure_layout_fallbacks(merged, defaults);

  // Ensure username is set
  merged.hiveUsername = username;

  return merged;
}

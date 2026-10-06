// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show } from "solid-js";
import { settings, updateSettings } from "../store";
import { DEFAULT_FOOTER_DATA } from "../../../shared/components/footer/types";

// ============================================
// Component
// ============================================

export function FooterSettings() {
  const footer_text = () => settings.footer_text ?? "";

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-2">Footer Settings</h2>
      <p class="text-sm text-text-muted mb-6">
        Customize the footer text displayed on your blog.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: controls */}
        <div>
          <label
            for="footer-text"
            class="block text-sm font-medium text-text mb-1"
          >
            Footer Text
          </label>
          <textarea
            id="footer-text"
            value={footer_text()}
            onInput={(e) =>
              updateSettings({ footer_text: e.currentTarget.value })
            }
            placeholder="Leave empty for default footer"
            rows={3}
            maxlength={500}
            class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          />
          <p class="text-xs text-text-muted mt-1">
            Override the default footer text. Leave empty to use the default.
          </p>
        </div>

        {/* Right column: preview */}
        <div class="bg-bg rounded-lg p-4 border border-border">
          <p class="text-xs text-text-muted uppercase tracking-wide mb-3">
            Preview
          </p>

          <div class="border-t border-border pt-4">
            <div class="flex items-center justify-center gap-3 flex-wrap text-text-muted text-sm text-center">
              <Show when={footer_text().trim()}>
                {(text) => (
                  <>
                    <span>{text()}</span>
                    <span class="text-border">|</span>
                  </>
                )}
              </Show>
              <span>Powered by {DEFAULT_FOOTER_DATA.platform_name}</span>
            </div>
            <p class="text-xs text-text-muted mt-3 text-center">
              Platform branding is set by the operator: a credit link (only
              when this field is empty) and a Ko-fi button may also appear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

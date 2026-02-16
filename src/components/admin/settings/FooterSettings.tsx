// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show } from "solid-js";
import { settings, updateSettings } from "../store";

// ============================================
// Component
// ============================================

export function FooterSettings() {
  const footer_text = () => settings.footer_text ?? "";
  const show_kofi = () => settings.footer_show_kofi ?? true;

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-2">Footer Settings</h2>
      <p class="text-sm text-text-muted mb-6">
        Customize the footer text and visibility of the Ko-fi button.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: controls */}
        <div class="space-y-5">
          {/* Footer Text */}
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

          {/* Show Ko-fi Button */}
          <div class="border-t border-border pt-4">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={show_kofi()}
                onChange={(e) =>
                  updateSettings({
                    footer_show_kofi: e.currentTarget.checked,
                  })
                }
                class="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <span class="text-sm font-medium text-text">
                  Show Ko-fi Button
                </span>
                <p class="text-xs text-text-muted">
                  Display the "Buy Me a Coffee" button in the footer.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Right column: preview */}
        <div class="bg-bg rounded-lg p-4 border border-border">
          <p class="text-xs text-text-muted uppercase tracking-wide mb-3">
            Preview
          </p>

          <div class="border-t border-border pt-4">
            <div class="flex items-center justify-center gap-3 flex-wrap text-text-muted text-sm text-center">
              <Show
                when={footer_text().trim()}
                fallback={
                  <span>
                    Built by{" "}
                    <span class="text-primary font-medium">
                      {settings.hiveUsername || "yourname"}
                    </span>
                  </span>
                }
              >
                <span>{footer_text().trim()}</span>
              </Show>

              <Show when={show_kofi()}>
                <span class="text-border">|</span>
                <span class="inline-flex items-center gap-1 text-xs bg-bg-secondary px-2 py-1 rounded">
                  Ko-fi
                </span>
              </Show>

              <span class="text-border">|</span>
              <span>Powered by Hive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

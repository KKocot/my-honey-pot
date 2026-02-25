// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, onMount, onCleanup, Show, type Component } from "solid-js";
import { Portal } from "solid-js/web";
import { useFocusTrap } from "../ui/Dialog";

const ExternalLinkDialog: Component = () => {
  const [is_open, set_is_open] = createSignal(false);
  const [target_url, set_target_url] = createSignal("");
  let dialog_ref: HTMLDivElement | undefined;

  const focus_trap = useFocusTrap(
    () => dialog_ref,
    () => is_open(),
  );

  const is_external_link = (el: HTMLAnchorElement): boolean => {
    const href = el.getAttribute("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("/")) return false;
    if (el.classList.contains("link-external")) return true;
    try {
      const url = new URL(href, window.location.origin);
      return url.origin !== window.location.origin;
    } catch {
      return false;
    }
  };

  const handle_click = (e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const anchor = target.closest("a");
    if (!anchor || !is_external_link(anchor)) return;

    const rendered_container = anchor.closest(".rendered-content");
    if (!rendered_container) return;

    e.preventDefault();
    e.stopPropagation();
    set_target_url(anchor.href);
    set_is_open(true);
  };

  const handle_confirm = () => {
    const url = target_url();
    set_is_open(false);
    set_target_url("");
    focus_trap.deactivate();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handle_cancel = () => {
    set_is_open(false);
    set_target_url("");
    focus_trap.deactivate();
  };

  const handle_keydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && is_open()) {
      handle_cancel();
    }
  };

  onMount(() => {
    document.addEventListener("click", handle_click, true);
    document.addEventListener("keydown", handle_keydown);
  });

  onCleanup(() => {
    document.removeEventListener("click", handle_click, true);
    document.removeEventListener("keydown", handle_keydown);
  });

  return (
    <Show when={is_open()}>
      <Portal>
        <div
          class="fixed inset-0 z-50 bg-black/50"
          onClick={handle_cancel}
          aria-hidden="true"
        />

        <div
          ref={(el) => {
            dialog_ref = el;
            focus_trap.activate();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="external-link-dialog-title"
          class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-card rounded-xl border border-border shadow-xl p-6"
          onKeyDown={handle_keydown}
        >
          <h2
            id="external-link-dialog-title"
            class="text-lg font-bold text-text mb-2"
          >
            You are leaving this site
          </h2>

          <p class="text-text-muted text-sm mb-4">
            You are about to open an external link. Make sure you trust the
            destination before proceeding.
          </p>

          <div class="bg-bg-secondary rounded-lg px-3 py-2 mb-6 break-all">
            <p class="text-text text-sm font-mono">{target_url()}</p>
          </div>

          <div class="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handle_cancel}
              class="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handle_confirm}
              class="px-4 py-2 rounded-lg bg-primary text-primary-text hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default ExternalLinkDialog;

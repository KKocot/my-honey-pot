// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show, createMemo } from "solid-js";
import { settings, updateSettings } from "../../store";
import {
  type LayoutTemplate,
  type PageLayoutConfig,
  type ContainerConfig,
  type LayoutElementId,
  type ContainerName,
  layoutTemplateLabels,
  containerLabels,
  pageElementLabels,
  USER_CONTAINER_ELEMENT_IDS,
  COMMUNITY_CONTAINER_ELEMENT_IDS,
  hasLeftSidebar,
  hasRightSidebar,
} from "../../types/index";
import { PageLayoutPreview } from "./PageLayoutPreview";

// ============================================
// Page Layout Editor - Flat Element List (v4)
// ============================================

const TEMPLATES: LayoutTemplate[] = [
  "no-sidebar",
  "sidebar-left",
  "sidebar-right",
  "both-sidebars",
];

const ALL_CONTAINERS: ContainerName[] = [
  "top",
  "sidebarLeft",
  "sidebarRight",
  "bottom",
];

/** Container names visible per template */
function get_visible_containers(template: LayoutTemplate): ContainerName[] {
  const containers: ContainerName[] = ["top"];
  if (hasLeftSidebar(template)) containers.push("sidebarLeft");
  if (hasRightSidebar(template)) containers.push("sidebarRight");
  containers.push("bottom");
  return containers;
}

export function LayoutEditor() {
  const config = () => settings.pageLayoutConfig;

  /** Available element IDs for user mode */
  const available_element_ids = createMemo((): readonly LayoutElementId[] =>
    USER_CONTAINER_ELEMENT_IDS,
  );

  /** Visible containers based on selected template */
  const visible_containers = createMemo(() =>
    get_visible_containers(config().template),
  );

  // ============================================
  // Helpers - read
  // ============================================

  /** Find which container an element is assigned to (searches ALL containers) */
  const find_element_container = (
    id: LayoutElementId,
  ): ContainerName | null => {
    const containers = config().containers;
    for (const key of ALL_CONTAINERS) {
      if (containers[key].elements.some((el) => el.id === id)) {
        return key;
      }
    }
    return null;
  };

  /** Get element active state within its container */
  const is_element_active = (id: LayoutElementId): boolean => {
    const container = find_element_container(id);
    if (!container) return false;
    const el = config().containers[container].elements.find(
      (el) => el.id === id,
    );
    return el?.active ?? false;
  };

  // ============================================
  // Helpers - update
  // ============================================

  const update_config = (partial: Partial<PageLayoutConfig>) => {
    updateSettings({
      pageLayoutConfig: { ...config(), ...partial },
    });
  };

  const set_template = (template: LayoutTemplate) => {
    const visible = new Set(get_visible_containers(template));
    const new_containers = { ...config().containers };
    let changed = false;

    // Move elements from hidden containers to the first visible one
    for (const key of ALL_CONTAINERS) {
      if (visible.has(key)) continue;
      const orphans = new_containers[key].elements;
      if (orphans.length === 0) continue;

      // Pick first visible container as target
      const target = ALL_CONTAINERS.find((c) => visible.has(c))!;
      new_containers[target] = {
        elements: [...new_containers[target].elements, ...orphans],
      };
      new_containers[key] = { elements: [] };
      changed = true;
    }

    if (changed) {
      update_config({ template, containers: new_containers });
    } else {
      update_config({ template });
    }
  };

  const update_container = (
    name: ContainerName,
    container: ContainerConfig,
  ) => {
    update_config({
      containers: { ...config().containers, [name]: container },
    });
  };

  /** Assign element to a container, or remove if container is null */
  const assign_element = (
    id: LayoutElementId,
    target: ContainerName | null,
  ) => {
    const new_containers = { ...config().containers };
    // Remove from all containers first
    for (const key of ALL_CONTAINERS) {
      new_containers[key] = {
        elements: new_containers[key].elements.filter((el) => el.id !== id),
      };
    }
    // Add to target container if specified
    if (target) {
      new_containers[target] = {
        elements: [
          ...new_containers[target].elements,
          { id, active: true },
        ],
      };
    }
    update_config({ containers: new_containers });
  };

  /** Toggle element active state within its current container */
  const toggle_element = (id: LayoutElementId) => {
    const container = find_element_container(id);
    if (!container) return;
    update_container(container, {
      elements: config().containers[container].elements.map((el) =>
        el.id === id ? { ...el, active: !el.active } : el,
      ),
    });
  };

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-4">
        Page Layout Editor
      </h2>
      <p class="text-text-muted text-sm mb-6">
        Choose a layout template and assign elements to containers.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Editor controls */}
        <div class="space-y-6">
          {/* Template Selector */}
          <div>
            <label class="block text-sm font-medium text-text mb-3">
              Layout Template
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <For each={TEMPLATES}>
                {(template) => (
                  <button
                    type="button"
                    onClick={() => set_template(template)}
                    class={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                      ${
                        config().template === template
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 text-text-muted hover:text-text"
                      }
                    `}
                  >
                    <TemplateIcon template={template} />
                    <span class="text-xs font-medium text-center">
                      {layoutTemplateLabels[template]}
                    </span>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Element Assignment List */}
          <div>
            <label class="block text-sm font-medium text-text mb-3">
              Element Assignment
            </label>
            <div class="space-y-2">
              <For each={available_element_ids()}>
                {(elementId) => {
                  const container = () => find_element_container(elementId);
                  const active = () => is_element_active(elementId);

                  return (
                    <div class="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-secondary">
                      {/* Label */}
                      <span class="flex-1 text-sm text-text">
                        {pageElementLabels[elementId] || elementId}
                      </span>

                      {/* Container select */}
                      <select
                        class="text-xs bg-bg border border-border rounded px-2 py-1.5 text-text min-w-[140px]"
                        value={container() ?? ""}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          assign_element(
                            elementId,
                            val === "" ? null : (val as ContainerName),
                          );
                        }}
                      >
                        <option value="">None</option>
                        <For each={visible_containers()}>
                          {(c) => (
                            <option value={c}>{containerLabels[c]}</option>
                          )}
                        </For>
                      </select>

                      {/* Active toggle - only when assigned to a container */}
                      <Show
                        when={container() !== null}
                        fallback={<div class="w-5 h-5" />}
                      >
                        <button
                          type="button"
                          onClick={() => toggle_element(elementId)}
                          class={`
                            w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                            ${
                              active()
                                ? "bg-primary border-primary"
                                : "border-border hover:border-primary/50"
                            }
                          `}
                          title={active() ? "Disable" : "Enable"}
                        >
                          <Show when={active()}>
                            <CheckIcon />
                          </Show>
                        </button>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>

        {/* Right column: Preview */}
        <div class="space-y-4">
          <PageLayoutPreview />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Template Icons - schematic SVG layout diagrams
// ============================================

function TemplateIcon(props: { template: LayoutTemplate }) {
  return (
    <svg class="w-10 h-10" viewBox="0 0 40 40" fill="none">
      {/* Header */}
      <rect
        x="2"
        y="2"
        width="36"
        height="6"
        rx="1"
        fill="currentColor"
        opacity="0.3"
      />
      {/* Footer */}
      <rect
        x="2"
        y="32"
        width="36"
        height="6"
        rx="1"
        fill="currentColor"
        opacity="0.3"
      />

      {/* Content area depends on template */}
      <Show when={props.template === "no-sidebar"}>
        <rect
          x="2"
          y="10"
          width="36"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.6"
        />
      </Show>

      <Show when={props.template === "sidebar-left"}>
        <rect
          x="2"
          y="10"
          width="10"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.4"
        />
        <rect
          x="14"
          y="10"
          width="24"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.6"
        />
      </Show>

      <Show when={props.template === "sidebar-right"}>
        <rect
          x="2"
          y="10"
          width="24"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.6"
        />
        <rect
          x="28"
          y="10"
          width="10"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.4"
        />
      </Show>

      <Show when={props.template === "both-sidebars"}>
        <rect
          x="2"
          y="10"
          width="8"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.4"
        />
        <rect
          x="12"
          y="10"
          width="16"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.6"
        />
        <rect
          x="30"
          y="10"
          width="8"
          height="20"
          rx="1"
          fill="currentColor"
          opacity="0.4"
        />
      </Show>
    </svg>
  );
}

// ============================================
// Small utility icons
// ============================================

function CheckIcon() {
  return (
    <svg class="w-3 h-3 text-primary-text" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

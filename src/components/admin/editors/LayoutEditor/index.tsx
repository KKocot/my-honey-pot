// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show } from "solid-js";
import { settings, updateSettings } from "../../store";
import { is_community_mode } from "../../queries";
import {
  pageElementLabels,
  ALL_PAGE_ELEMENT_IDS,
  USER_PAGE_ELEMENT_IDS,
  COMMUNITY_PAGE_ELEMENT_IDS,
  type PageLayout,
  type PageLayoutSection,
  type PageSlotPosition,
} from "../../types/index";
import { Slider } from "../../../ui";
import { SlotContainer } from "./SlotContainer";
import { PageLayoutPreview } from "./PageLayoutPreview";

// ============================================
// Page Layout Editor - Button-based UI
// ============================================

const SLOTS: PageSlotPosition[] = [
  "top",
  "sidebar-left",
  "main",
  "sidebar-right",
  "bottom",
];

export function LayoutEditor() {
  // Get sections for a specific slot
  const getSectionsInSlot = (slot: PageSlotPosition) => {
    return settings.pageLayout.sections.filter((s) => s.slot === slot);
  };

  // Get all used element IDs
  const getUsedElementIds = () => {
    return new Set(settings.pageLayout.sections.flatMap((s) => s.elements));
  };

  // Get allowed element IDs for current mode
  const getAllowedElementIds = () => {
    return is_community_mode()
      ? COMMUNITY_PAGE_ELEMENT_IDS
      : USER_PAGE_ELEMENT_IDS;
  };

  // Get unused elements (filtered by mode)
  const getUnusedElements = () => {
    const used_ids = getUsedElementIds();
    const allowed_ids = getAllowedElementIds();
    return ALL_PAGE_ELEMENT_IDS.filter(
      (id) => allowed_ids.has(id) && !used_ids.has(id),
    );
  };

  // ============================================
  // Update functions
  // ============================================

  const updatePageLayout = (layout: PageLayout) => {
    updateSettings({ pageLayout: layout });
  };

  // ============================================
  // Section operations
  // ============================================

  const addSection = (slot: PageSlotPosition) => {
    const newSection: PageLayoutSection = {
      id: `page-sec-${Date.now()}`,
      slot,
      orientation: "horizontal",
      elements: [],
      active: true,
    };
    updatePageLayout({
      sections: [...settings.pageLayout.sections, newSection],
    });
  };

  const toggleSectionActive = (sectionId: string) => {
    const section = settings.pageLayout.sections.find(
      (s) => s.id === sectionId,
    );
    if (section && section.elements.includes("footer")) return;
    updatePageLayout({
      sections: settings.pageLayout.sections.map((s) =>
        s.id === sectionId
          ? { ...s, active: s.active !== false ? false : true }
          : s,
      ),
    });
  };

  const removeSection = (sectionId: string) => {
    const section = settings.pageLayout.sections.find(
      (s) => s.id === sectionId,
    );
    if (section && section.elements.includes("footer")) return;
    updatePageLayout({
      sections: settings.pageLayout.sections.filter((s) => s.id !== sectionId),
    });
  };

  const toggleOrientation = (sectionId: string) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              orientation:
                s.orientation === "horizontal" ? "vertical" : "horizontal",
            }
          : s,
      ),
    });
  };

  const moveSectionUp = (slot: PageSlotPosition, sectionId: string) => {
    const sectionsInSlot = getSectionsInSlot(slot);
    const index = sectionsInSlot.findIndex((s) => s.id === sectionId);
    if (index <= 0) return;

    const allSections = [...settings.pageLayout.sections];
    const globalIndex = allSections.findIndex((s) => s.id === sectionId);
    const prevInSlot = sectionsInSlot[index - 1];
    const prevGlobalIndex = allSections.findIndex(
      (s) => s.id === prevInSlot.id,
    );

    // Swap positions
    [allSections[globalIndex], allSections[prevGlobalIndex]] = [
      allSections[prevGlobalIndex],
      allSections[globalIndex],
    ];
    updatePageLayout({ sections: allSections });
  };

  const moveSectionDown = (slot: PageSlotPosition, sectionId: string) => {
    const sectionsInSlot = getSectionsInSlot(slot);
    const index = sectionsInSlot.findIndex((s) => s.id === sectionId);
    if (index === -1 || index >= sectionsInSlot.length - 1) return;

    const allSections = [...settings.pageLayout.sections];
    const globalIndex = allSections.findIndex((s) => s.id === sectionId);
    const nextInSlot = sectionsInSlot[index + 1];
    const nextGlobalIndex = allSections.findIndex(
      (s) => s.id === nextInSlot.id,
    );

    // Swap positions
    [allSections[globalIndex], allSections[nextGlobalIndex]] = [
      allSections[nextGlobalIndex],
      allSections[globalIndex],
    ];
    updatePageLayout({ sections: allSections });
  };

  // ============================================
  // Element operations
  // ============================================

  const addElementToSection = (sectionId: string, elementId: string) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) =>
        section.id === sectionId
          ? { ...section, elements: [...section.elements, elementId] }
          : section,
      ),
    });
  };

  const removeElement = (sectionId: string, elementId: string) => {
    if (elementId === "footer") return;
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              elements: section.elements.filter((id) => id !== elementId),
            }
          : section,
      ),
    });
  };

  const moveElementUp = (sectionId: string, elementIndex: number) => {
    if (elementIndex <= 0) return;
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const newElements = [...section.elements];
        [newElements[elementIndex], newElements[elementIndex - 1]] = [
          newElements[elementIndex - 1],
          newElements[elementIndex],
        ];
        return { ...section, elements: newElements };
      }),
    });
  };

  const moveElementDown = (sectionId: string, elementIndex: number) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (elementIndex >= section.elements.length - 1) return section;
        const newElements = [...section.elements];
        [newElements[elementIndex], newElements[elementIndex + 1]] = [
          newElements[elementIndex + 1],
          newElements[elementIndex],
        ];
        return { ...section, elements: newElements };
      }),
    });
  };

  // Check if any active section uses a sidebar slot with elements
  const has_sidebar = () =>
    settings.pageLayout.sections.some(
      (s) =>
        (s.slot === "sidebar-left" || s.slot === "sidebar-right") &&
        s.elements.length > 0 &&
        s.active !== false,
    );

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-4">
        Page Layout Editor
      </h2>
      <p class="text-text-muted text-sm mb-6">
        Configure page layout by adding sections and elements to each slot.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slot-based Editor */}
        <div class="space-y-4">
          <For each={SLOTS}>
            {(slot) => (
              <SlotContainer
                slot={slot}
                sections={getSectionsInSlot(slot)}
                unusedElements={getUnusedElements()}
                onAddSection={() => addSection(slot)}
                onRemoveSection={removeSection}
                onToggleOrientation={toggleOrientation}
                onToggleSectionActive={toggleSectionActive}
                onMoveSectionUp={(sectionId) => moveSectionUp(slot, sectionId)}
                onMoveSectionDown={(sectionId) =>
                  moveSectionDown(slot, sectionId)
                }
                onAddElement={addElementToSection}
                onRemoveElement={removeElement}
                onMoveElementUp={moveElementUp}
                onMoveElementDown={moveElementDown}
              />
            )}
          </For>

          {/* Available Elements */}
          <Show when={getUnusedElements().length > 0}>
            <div class="mt-4 pt-4 border-t border-border">
              <p class="text-xs text-text-muted uppercase tracking-wide mb-2">
                Available Elements ({getUnusedElements().length})
              </p>
              <div class="flex flex-wrap gap-1">
                <For each={getUnusedElements()}>
                  {(elementId) => (
                    <span class="px-2 py-1 rounded text-xs bg-bg-secondary text-text-muted">
                      {pageElementLabels[elementId] || elementId}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        {/* Live Preview */}
        <div class="space-y-4">
          <PageLayoutPreview />
          <Slider
            label="Sidebar Width"
            unit="px"
            min={200}
            max={400}
            value={settings.sidebarWidthPx}
            onChange={(val) => updateSettings({ sidebarWidthPx: val })}
            disabled={!has_sidebar()}
          />
        </div>
      </div>
    </div>
  );
}

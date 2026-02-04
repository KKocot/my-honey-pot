// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * SectionRenderer - SolidJS component
 * Renders a section with proper orientation using shared utilities
 */

import { For, type Accessor } from 'solid-js'
import type { PageLayoutSection } from '../../../components/admin/types/index'
import type { HiveData } from '../../../components/admin/queries'
import { get_slot_container_class, get_element_wrapper_class } from '../page-layout'
import { ElementRenderer } from './ElementRenderer'

interface SectionRendererProps {
  section: PageLayoutSection
  inSidebar?: boolean
  activeTab: Accessor<string>
  setActiveTab: (tab: string) => void
  data: Accessor<HiveData | null>
}

export function SectionRenderer(props: SectionRendererProps) {
  return (
    <div class={get_slot_container_class(props.section.slot, props.section.orientation)}>
      <For each={props.section.elements}>
        {(elementId) => (
          <div class={get_element_wrapper_class(props.section.orientation, props.section.slot)}>
            <ElementRenderer
              elementId={elementId}
              inSidebar={props.inSidebar}
              activeTab={props.activeTab}
              setActiveTab={props.setActiveTab}
              data={props.data}
            />
          </div>
        )}
      </For>
    </div>
  )
}

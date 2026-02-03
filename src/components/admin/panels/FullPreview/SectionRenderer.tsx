import { For, type Accessor } from 'solid-js'
import type { PageLayoutSection } from '../../types/index'
import type { HiveData } from '../../queries'
import { ElementRenderer } from './ElementRenderer'

// ============================================
// SectionRenderer Component
// Renders a section with proper orientation
// ============================================

interface SectionRendererProps {
  section: PageLayoutSection
  inSidebar?: boolean
  activeTab: Accessor<string>
  setActiveTab: (tab: string) => void
  data: Accessor<HiveData | null>
}

export function SectionRenderer(props: SectionRendererProps) {
  const isHorizontal = () => props.section.orientation === 'horizontal'

  return (
    <div
      class={isHorizontal() ? 'flex flex-wrap items-start gap-4' : 'flex flex-col gap-4'}
    >
      <For each={props.section.elements}>
        {(elementId) => (
          <div class={isHorizontal() ? 'flex-shrink-0' : 'w-full'}>
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

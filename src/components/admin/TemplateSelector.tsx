import { For, createSignal } from 'solid-js'
import { settings, updateSettings } from './store'
import { applyThemeColors } from './queries'
import { websiteTemplates, themePresets, type WebsiteTemplate, type SettingsData } from './types'
import { showToast } from '../ui'

// ============================================
// Template Card Component
// ============================================

interface TemplateCardProps {
  template: WebsiteTemplate
  onSelect: (template: WebsiteTemplate) => void
}

function TemplateCard(props: TemplateCardProps) {
  const getThemePreview = () => {
    const themeId = props.template.settings.siteTheme
    const theme = themePresets.find((p) => p.id === themeId) || themePresets[0]
    return theme.colors
  }

  const colors = getThemePreview()

  return (
    <button
      type="button"
      class="group relative flex flex-col rounded-xl border border-border bg-bg-card p-3 text-left transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={() => props.onSelect(props.template)}
    >
      {/* Mini Preview */}
      <div
        class="mb-3 aspect-video w-full overflow-hidden rounded-lg"
        style={{ background: colors.bg }}
      >
        {/* Simplified layout preview */}
        <div class="flex h-full flex-col p-2">
          {/* Header */}
          <div
            class="mb-1 h-2 w-full rounded-sm"
            style={{ background: colors.primary }}
          />
          {/* Content area */}
          <div class="flex flex-1 gap-1">
            {/* Sidebar if exists */}
            {props.template.settings.pageLayout?.sections.some(
              (s) => s.slot === 'sidebar-left' && s.active
            ) && (
              <div
                class="w-1/4 rounded-sm"
                style={{ background: colors.bgCard }}
              />
            )}
            {/* Main content */}
            <div class="flex-1 space-y-1">
              {props.template.settings.postsLayout === 'grid' ||
              props.template.settings.postsLayout === 'masonry' ? (
                <div class="grid grid-cols-2 gap-1 h-full">
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                </div>
              ) : (
                <>
                  <div class="h-3 rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="h-3 rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="h-3 rounded-sm" style={{ background: colors.bgCard }} />
                </>
              )}
            </div>
            {/* Right sidebar if exists */}
            {props.template.settings.pageLayout?.sections.some(
              (s) => s.slot === 'sidebar-right' && s.active
            ) && (
              <div
                class="w-1/4 rounded-sm"
                style={{ background: colors.bgCard }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div class="flex items-start gap-2">
        <span class="text-2xl">{props.template.icon}</span>
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-text truncate">{props.template.name}</h3>
          <p class="text-xs text-text-muted line-clamp-2">{props.template.description}</p>
        </div>
      </div>

      {/* Hover overlay */}
      <div class="absolute inset-0 rounded-xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

// ============================================
// Template Selector Component
// ============================================

export function TemplateSelector() {
  const [isExpanded, setIsExpanded] = createSignal(true)

  const applyTemplate = (template: WebsiteTemplate) => {
    // Apply all template settings
    const newSettings: Partial<SettingsData> = {
      ...template.settings,
      // Ensure scroll animation is enabled when type is set
      scrollAnimationEnabled: template.settings.scrollAnimationType !== 'none',
    }

    updateSettings(newSettings)

    // Apply theme colors
    if (template.settings.siteTheme) {
      const theme = themePresets.find((p) => p.id === template.settings.siteTheme)
      if (theme) {
        applyThemeColors(theme.colors)
      }
    }

    showToast(`Applied "${template.name}" template`, 'success')
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <button
        type="button"
        class="flex w-full items-center justify-between text-left"
        onClick={() => setIsExpanded(!isExpanded())}
      >
        <div>
          <h2 class="text-xl font-semibold text-primary">Quick Start Templates</h2>
          <p class="text-sm text-text-muted mt-1">
            Choose a template to instantly apply a complete design preset
          </p>
        </div>
        <svg
          class={`w-6 h-6 text-text-muted transition-transform ${isExpanded() ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded() && (
        <div class="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <For each={websiteTemplates}>
            {(template) => (
              <TemplateCard template={template} onSelect={applyTemplate} />
            )}
          </For>
        </div>
      )}
    </div>
  )
}

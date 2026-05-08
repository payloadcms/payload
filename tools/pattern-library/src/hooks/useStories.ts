import type React from 'react'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type StoryMeta = {
  description?: string
  title: string
}

export type StoryVariant = {
  component: () => React.JSX.Element
  name: string
}

export type StoryEntry = {
  meta: StoryMeta
  modulePath: string
  variants: StoryVariant[]
}

export type SidebarSection = {
  items: SidebarItem[]
  title: string
}

export type SidebarItem = {
  label: string
  storyPath: string
}

const storyModules = import.meta.glob<Record<string, unknown>>(
  '../../../../packages/ui/src/**/*.stories.tsx',
  { eager: false },
)

const componentSourceModules = import.meta.glob<string>(
  '../../../../packages/ui/src/**/index.tsx',
  { eager: false, import: 'default', query: '?raw' },
)

export async function loadComponentSource(storyModulePath: string): Promise<null | string> {
  const componentPath = storyModulePath.replace(/\/[^/]+\.stories\.tsx$/, '/index.tsx')
  const loader = componentSourceModules[componentPath]
  if (!loader) {
    return null
  }
  try {
    return await loader()
  } catch {
    return null
  }
}

function buildSidebarSections(entries: Map<string, StoryEntry>): SidebarSection[] {
  const sections = new Map<string, SidebarItem[]>()

  for (const [modulePath, entry] of entries) {
    const parts = entry.meta.title.split('/').map((p) => p.trim())
    const sectionTitle = parts[0] ?? 'Other'
    const itemLabel = parts[parts.length - 1] ?? modulePath

    const items = sections.get(sectionTitle) ?? []
    items.push({ label: itemLabel, storyPath: modulePath })
    sections.set(sectionTitle, items)
  }

  const sectionOrder = ['Tokens', 'Icons', 'Elements', 'Fields', 'Views']

  return Array.from(sections.entries())
    .sort(([a], [b]) => {
      const ai = sectionOrder.indexOf(a)
      const bi = sectionOrder.indexOf(b)
      if (ai === -1 && bi === -1) {
        return a.localeCompare(b)
      }
      if (ai === -1) {
        return 1
      }
      if (bi === -1) {
        return -1
      }
      return ai - bi
    })
    .map(([title, items]) => ({
      items: items.sort((a, b) => a.label.localeCompare(b.label)),
      title,
    }))
}

function extractVariants(mod: Record<string, unknown>): StoryVariant[] {
  return Object.entries(mod)
    .filter(([key, value]) => key !== 'meta' && typeof value === 'function')
    .map(([name, component]) => ({ component: component as () => React.JSX.Element, name }))
}

export function useStories() {
  const [entries, setEntries] = useState<Map<string, StoryEntry>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAllMetas() {
      const loaded = new Map<string, StoryEntry>()

      await Promise.all(
        Object.entries(storyModules).map(async ([modulePath, loader]) => {
          try {
            const mod = await loader()
            const meta = mod['meta'] as StoryMeta | undefined
            if (!meta?.title) {
              return
            }
            const variants = extractVariants(mod)
            loaded.set(modulePath, { meta, modulePath, variants })
          } catch {
            // Skip story files that fail to load
          }
        }),
      )

      setEntries(loaded)
      setIsLoading(false)
    }

    void loadAllMetas()
  }, [])

  const getStory = useCallback(
    (modulePath: string): StoryEntry | undefined => entries.get(modulePath),
    [entries],
  )

  const sidebarSections = useMemo(() => buildSidebarSections(entries), [entries])

  return { getStory, isLoading, sidebarSections }
}

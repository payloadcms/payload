import type { SanitizedConfig, SidebarTab } from '../config/types.js'

import { getDefaultSidebarTabs } from './getDefaultSidebarTabs.js'

export function buildSidebarTabs(config: SanitizedConfig): SidebarTab[] {
  const allTabs = [...getDefaultSidebarTabs(), ...(config.admin?.sidebar?.tabs || [])]

  const merged = allTabs.reduce((acc, tab) => {
    const existing = acc.find((t) => t.slug === tab.slug)

    if (existing) {
      Object.assign(existing, tab)
    } else {
      acc.push({ ...tab })
    }

    return acc
  }, [] as SidebarTab[])

  return merged.filter((tab) => !tab.disabled)
}

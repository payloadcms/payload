import { describe, expect, it } from 'vitest'

import type { SanitizedConfig, SidebarTab } from '../config/types.js'

import { buildSidebarTabs } from './buildSidebarTabs.js'

describe('buildSidebarTabs', () => {
  const mockConfig: Partial<SanitizedConfig> = {
    admin: {},
  }

  it('should return built-in tabs by default', () => {
    const tabs = buildSidebarTabs(mockConfig as SanitizedConfig)

    expect(tabs).toHaveLength(1)
    expect(tabs[0].slug).toBe('collections')
    expect(tabs[0].isDefaultActive).toBe(true)
  })

  it('should allow adding custom tabs', () => {
    const config: Partial<SanitizedConfig> = {
      admin: {
        sidebar: {
          tabs: [
            {
              slug: 'custom',
              icon: '/icons/Custom',
              component: '/tabs/Custom',
            },
          ],
        },
      },
    }

    const tabs = buildSidebarTabs(config as SanitizedConfig)

    expect(tabs).toHaveLength(2)
    expect(tabs.find((t) => t.slug === 'custom')).toBeDefined()
  })

  it('should allow disabling built-in tabs', () => {
    const config: Partial<SanitizedConfig> = {
      admin: {
        sidebar: {
          tabs: [
            {
              slug: 'collections',
              disabled: true,
            },
          ],
        },
      },
    }

    const tabs = buildSidebarTabs(config as SanitizedConfig)

    expect(tabs).toHaveLength(0)
  })

  it('should allow overriding built-in tabs', () => {
    const config: Partial<SanitizedConfig> = {
      admin: {
        sidebar: {
          tabs: [
            {
              slug: 'collections',
              icon: '/icons/CustomList',
              component: '/tabs/CustomCollections',
            },
          ],
        },
      },
    }

    const tabs = buildSidebarTabs(config as SanitizedConfig)

    expect(tabs).toHaveLength(1)
    expect(tabs[0].slug).toBe('collections')
    expect(tabs[0].icon).toBe('/icons/CustomList')
    expect(tabs[0].component).toBe('/tabs/CustomCollections')
  })

  it('should merge tabs by slug in order', () => {
    const config: Partial<SanitizedConfig> = {
      admin: {
        sidebar: {
          tabs: [
            { slug: 'tab1', icon: '/icon1', component: '/comp1' },
            { slug: 'tab2', icon: '/icon2', component: '/comp2' },
            { slug: 'tab1', label: 'Override' }, // Override tab1
          ],
        },
      },
    }

    const tabs = buildSidebarTabs(config as SanitizedConfig)

    const tab1 = tabs.find((t) => t.slug === 'tab1')
    expect(tab1.label).toBe('Override')
    expect(tab1.icon).toBe('/icon1') // Preserved from first definition
  })
})

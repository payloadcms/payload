import { describe, expect, it } from 'vitest'

import type { Config } from './types.js'

import { sanitizeConfig } from './sanitize.js'

const VERSION_MENU_ITEM = '@payloadcms/ui/rsc#PayloadVersionMenuItem'

/** Minimal config shape — db/editor are not used during the sanitization paths we test */
// @ts-expect-error
const minimalConfig: Config = {
  collections: [],
}

describe('version menu auto-injection', () => {
  it('populates packageVersions.payload with a semver string', async () => {
    const sanitized = await sanitizeConfig(minimalConfig)

    expect(sanitized.admin.packageVersions.payload).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('appends the menu item after user-defined settingsMenu entries', async () => {
    const item1 = '/components/Item1.tsx#Item1'
    const item2 = '/components/Item2.tsx#Item2'

    // @ts-expect-error
    const config: Config = {
      collections: [],
      admin: {
        components: {
          settingsMenu: [item1, item2],
        },
      },
    }

    const sanitized = await sanitizeConfig(config)
    const menu = sanitized.admin.components!.settingsMenu!

    expect(menu.slice(0, 2)).toEqual([item1, item2])
    expect(menu[menu.length - 1]).toBe(VERSION_MENU_ITEM)
  })

  it('does NOT inject the menu item when versionInSettingsMenu is false', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [],
      admin: {
        versionInSettingsMenu: false,
        components: {
          settingsMenu: ['/components/Item1.tsx#Item1'],
        },
      },
    }

    const sanitized = await sanitizeConfig(config)
    const menu = sanitized.admin.components?.settingsMenu ?? []

    expect(menu).not.toContain(VERSION_MENU_ITEM)
  })

  it('injects the menu item when no settingsMenu is defined', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [],
      admin: {
        components: {},
      },
    }

    const sanitized = await sanitizeConfig(config)
    const menu = sanitized.admin.components!.settingsMenu!

    expect(menu).toContain(VERSION_MENU_ITEM)
  })
})

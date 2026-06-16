import { describe, expect, it, vi } from 'vitest'
import type { SanitizedConfig, UserMenuSettingsItem } from '../../config/types.js'
import type { AddToImportMap, Imports, InternalImportMap } from './index.js'

import { iterateConfig } from './iterateConfig.js'

const flatItem = './components/Flat.tsx#Flat'
const groupedItem = './components/Grouped.tsx#Grouped'

describe('iterateConfig', () => {
  it('should add grouped user menu settings items to import map entries', () => {
    const addToImportMap = vi.fn<AddToImportMap>()
    const config = {
      admin: {
        components: {
          userMenuSettingsItems: [
            flatItem,
            {
              group: 'Developer Tools',
              items: [groupedItem],
            },
          ] as UserMenuSettingsItem[],
        },
        importMap: {
          baseDir: process.cwd(),
          generators: [],
        },
      },
      blocks: {},
      collections: [],
      globals: [],
    } as unknown as SanitizedConfig

    iterateConfig({
      addToImportMap,
      baseDir: process.cwd(),
      config,
      importMap: {} as InternalImportMap,
      imports: {} as Imports,
    })

    const calls = addToImportMap.mock.calls.map(([call]) => call)

    expect(calls).toContain(flatItem)
    expect(calls).toContain(groupedItem)
    expect(calls).not.toContainEqual(
      expect.objectContaining({
        group: 'Developer Tools',
      }),
    )
  })
})

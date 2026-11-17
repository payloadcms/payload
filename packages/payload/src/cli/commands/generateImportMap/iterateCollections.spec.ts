import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedConfig } from '../../../config/types.js'

import { expect, test, vi } from 'vitest'

import { iterateCollections } from './iterateCollections.js'

vi.mock('./iterateFields.js', () => ({ genImportMapIterateFields: vi.fn() }))

test('should register both hierarchy icons independently of sidebar tabs', () => {
  const addToImportMap = vi.fn()
  const collection = {
    slug: 'libraries',
    admin: {},
    fields: [],
    hierarchy: {
      admin: {
        components: {
          Icon: '/LibraryIcon#LibraryIcon',
          SmallIcon: '/LibrarySmallIcon#LibrarySmallIcon',
        },
        injectSidebarTab: false,
      },
    },
  } as SanitizedCollectionConfig

  iterateCollections({
    addToImportMap,
    baseDir: '/',
    collections: [collection],
    config: {} as SanitizedConfig,
    importMap: {},
    imports: {},
  })

  expect(addToImportMap).toHaveBeenCalledWith('/LibraryIcon#LibraryIcon')
  expect(addToImportMap).toHaveBeenCalledWith('/LibrarySmallIcon#LibrarySmallIcon')
})

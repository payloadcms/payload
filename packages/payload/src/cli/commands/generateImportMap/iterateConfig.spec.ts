import type { SanitizedConfig } from '../../../config/types.js'

import { expect, it, vi } from 'vitest'

import { iterateConfig } from './iterateConfig.js'

it('should register optional widget control icons in the import map', () => {
  const addToImportMap = vi.fn()
  const Icon = { path: '@payloadcms/ui#TableIcon', clientProps: { size: 16 } }

  iterateConfig({
    addToImportMap,
    baseDir: '',
    config: {
      admin: {
        dashboard: {
          widgets: [
            {
              slug: 'preview',
              Component: './Preview',
              controls: [{ name: 'collection', type: 'select', options: ['pages'], Icon }],
            },
          ],
        },
      },
      collections: [],
      globals: [],
    } as unknown as SanitizedConfig,
    importMap: {},
    imports: {},
  })

  expect(addToImportMap).toHaveBeenCalledWith(Icon)
  expect(addToImportMap).toHaveBeenCalledWith('./Preview')
})

it('should register a custom widget preview component', () => {
  const addToImportMap = vi.fn()
  const Preview = { path: './SalesPreview.js', clientProps: { compact: true } }

  iterateConfig({
    addToImportMap,
    baseDir: '',
    config: {
      admin: {
        dashboard: {
          widgets: [{ slug: 'sales', Component: './Sales.js', preview: { Component: Preview } }],
        },
      },
      collections: [],
      globals: [],
    } as unknown as SanitizedConfig,
    importMap: {},
    imports: {},
  })

  expect(addToImportMap).toHaveBeenCalledWith(Preview)
})

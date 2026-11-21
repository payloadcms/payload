import type { CollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it } from 'vitest'

import { afterRead } from './index.js'

const collection = {
  slug: 'pages',
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'mode', type: 'text' },
        { name: 'items', type: 'array', fields: [{ name: 'label', type: 'text' }] },
      ],
      localized: true,
    },
    {
      name: 'tabbed',
      type: 'tabs',
      tabs: [
        {
          name: 'seo',
          fields: [{ name: 'title', type: 'text' }],
          localized: true,
        },
      ],
    },
  ],
} as unknown as CollectionConfig

const req = {
  locale: 'en',
  payload: {
    config: {
      defaultDepth: 0,
      localization: { defaultLocale: 'en', localeCodes: ['en', 'es'] },
      maxDepth: 10,
    },
  },
} as unknown as PayloadRequest

const run = (doc: Record<string, unknown>, flattenLocales: boolean) =>
  afterRead({
    collection,
    context: {},
    depth: 0,
    doc,
    flattenLocales,
    locale: 'en',
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })

describe('afterRead localized group/tab with flattenLocales: false', () => {
  it('keeps already-flattened localized group and named tab data intact', async () => {
    const doc = {
      hero: { mode: 'plain', items: [{ label: 'a' }] },
      seo: { title: 'T' },
    }

    const result = await run(structuredClone(doc), false)

    expect(result).toMatchObject(doc)
  })

  it('still traverses locale-keyed group data', async () => {
    const result = await run(
      { hero: { en: { mode: 'plain', items: [{ label: 'a' }] }, es: { mode: 'llano' } } },
      false,
    )

    expect(result.hero).toMatchObject({
      en: { mode: 'plain', items: [{ label: 'a' }] },
      es: { mode: 'llano' },
    })
  })
})

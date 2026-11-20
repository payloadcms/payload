import type { I18nClient } from '@payloadcms/translations'
import type { AdminViewAdapter, MetaConfig, SanitizedConfig } from 'payload'

import { expect, test } from 'vitest'

import { generatePageMetadata } from './generatePageMetadata.js'

// Each view's metadata is its own key, so the test sees which view a route resolved to.
const adminViews = new Proxy(
  {},
  { get: (_, key) => ({ generateMetadata: async () => ({ title: String(key) }) }) },
) as unknown as AdminViewAdapter<unknown, MetaConfig>

test.each([
  ['logout', 'logout'],
  ['logout-inactivity', 'logoutInactivity'],
  ['unauthorized', 'unauthorized'],
])('/%s uses the %s view metadata', async (segment, view) => {
  const meta = await generatePageMetadata({
    adminViews,
    config: { admin: {}, collections: [], globals: [] } as unknown as SanitizedConfig,
    i18n: {} as I18nClient,
    params: { segments: [segment] },
  })
  expect(meta.title).toBe(view)
})

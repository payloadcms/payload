import { describe, expect, it } from 'vitest'

import type { Plugin } from '../../config/types.js'
import type { Payload } from '../../types/index.js'

import { definePlugin } from '../../config/definePlugin.js'
import { getInstalledPluginSlugs } from './index.js'

// `getInstalledPluginSlugs` is what populates `baseEvent.plugins` - the list of
// installed plugin slugs sent with every telemetry event.
const payloadWithPlugins = (plugins: Plugin[]): Payload =>
  ({ config: { plugins } }) as unknown as Payload

describe('telemetry installed plugins', () => {
  it('should send only first-party slugs, ignoring custom and slug-less plugins', () => {
    const seoPlugin = definePlugin({
      slug: '@payloadcms/plugin-seo',
      plugin: ({ config }) => config,
    })()
    const stripePlugin = definePlugin({
      slug: '@payloadcms/plugin-stripe',
      plugin: ({ config }) => config,
    })()
    // A user's own plugin — its slug is author-defined and must not be sent.
    const customPlugin = definePlugin({
      slug: 'acme-internal-billing',
      plugin: ({ config }) => config,
    })()
    const legacyPlugin: Plugin = (config) => config

    const slugs = getInstalledPluginSlugs(
      payloadWithPlugins([seoPlugin, stripePlugin, customPlugin, legacyPlugin]),
    )

    expect(slugs).toEqual(['@payloadcms/plugin-seo', '@payloadcms/plugin-stripe'])
  })

  it('should send an empty array when no first-party plugins are installed', () => {
    expect(getInstalledPluginSlugs(payloadWithPlugins([]))).toEqual([])
  })
})

import type { Config, SanitizedConfig } from '../../../config/types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from '../../../config/sanitize.js'
import { jobsCollectionSlug } from '../../../queues/config/collection.js'
import { getFeatureInfo } from './getFeatureInfo.js'

// CONTEXT: Telemetry reads the config PRE-SANITIZATION
// We have manual sanitization that takes place to offset Payload defaults
// If any of these change, telemetry could end up reporting defaults as user-provided values

// These tests compare the manual sanitization to Payload's sanitizer.
// If one fails, the sanitization has become out of sync.
// We then need to update the manual filtering so default features remain excluded from telemetry.
const sanitize = (config: Partial<Config> = {}): SanitizedConfig =>
  sanitizeConfig({
    db: {
      defaultIDType: 'text',
      // @ts-expect-error partial database adapter for config sanitization
      init: () => {},
    },
    secret: 'secret',
    ...config,
  })

describe('feature telemetry sanitization guardrails', () => {
  it('should count one custom widget after Payload adds its system widgets', () => {
    const config = sanitize({
      admin: {
        dashboard: {
          widgets: [{ Component: '/CustomWidget', slug: 'custom' }],
        },
      },
    })

    expect(getFeatureInfo(config).adminCustomization?.customDashboardWidgetCount).toBe(1)
  })

  it('should exclude Payload system collections from collection metrics', () => {
    const config = sanitize({
      collections: [
        {
          slug: 'posts',
          auth: true,
          enableQueryPresets: true,
          fields: [],
        },
      ],
    })

    expect(getFeatureInfo(config)).toMatchObject({
      basicDenominators: { collectionCount: 1 },
      queryPresetCollectionCount: 1,
    })
  })

  it('should exclude the Payload jobs collection by its canonical slug', () => {
    const config = sanitize({
      jobs: {
        tasks: [{ handler: async () => ({ output: null }), slug: 'custom-task' }],
      },
    })

    config.collections = config.collections.filter(({ slug }) => slug === jobsCollectionSlug)

    expect(getFeatureInfo(config).basicDenominators?.collectionCount).toBe(0)
  })

  it('should exclude the system scheduled-publishing task from task metrics', () => {
    const config = sanitize({
      collections: [
        {
          slug: 'posts',
          auth: true,
          fields: [],
          versions: { drafts: { schedulePublish: true } },
        },
      ],
    })

    expect(getFeatureInfo(config).jobsAndQueues?.taskCount).toBe(0)
  })

  it('should exclude the Payload jobs stats global from global metrics', () => {
    const config = sanitize({
      jobs: {
        tasks: [{ handler: async () => ({ output: null }), slug: 'custom-task' }],
      },
    })

    expect(getFeatureInfo(config).basicDenominators?.globalCount).toBe(0)
  })

  it('should exclude generated hierarchy tabs from custom component metrics', () => {
    const config = sanitize({
      collections: [{ slug: 'pages', auth: true, fields: [], hierarchy: true }],
    })

    expect(getFeatureInfo(config).adminCustomization?.customAdminComponentCount).toBe(0)
  })
})

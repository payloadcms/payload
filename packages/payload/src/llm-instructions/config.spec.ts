import { describe, expect, it } from 'vitest'

import type { Config } from '../config/types.js'

import { sanitizeConfig } from '../config/sanitize.js'
import { instructionsCollectionSlug } from './shared.js'

describe('LLM instructions config', () => {
  it('should use plain text when no editor is configured', () => {
    const config = createConfig()
    const collection = config.collections.find(({ slug }) => slug === instructionsCollectionSlug)

    expect(
      collection?.flattenedFields.find(({ name }) => name === 'additionalInstructions')?.type,
    ).toBe('textarea')
  })

  it('should remove the collection and menu items when instruction management is disabled', () => {
    const config = createConfig({ llmInstructions: false })

    expect(config.collections.some(({ slug }) => slug === instructionsCollectionSlug)).toBe(false)
    expect(config.collections[0]?.admin.components?.listMenuItems ?? []).not.toContain(
      '@payloadcms/ui#LLMInstructionsMenuItem',
    )
    expect(config.globals[0]?.admin.components?.edit?.editMenuItems ?? []).not.toContain(
      '@payloadcms/ui#LLMInstructionsMenuItem',
    )
    expect(config.collections[0]?.llmInstructions).toBe('Keep titles concise.')
  })
})

const createConfig = ({ llmInstructions }: { llmInstructions?: Config['llmInstructions'] } = {}) =>
  sanitizeConfig({
    collections: [
      { slug: 'pages', fields: [], llmInstructions: 'Keep titles concise.' },
      { slug: 'hidden-pages', admin: { hidden: true }, fields: [] },
    ],
    db: {
      defaultIDType: 'text',
      init: () => {
        throw new Error('These config tests do not initialize a database.')
      },
    },
    globals: [
      { slug: 'settings', fields: [] },
      { slug: 'hidden-settings', admin: { hidden: true }, fields: [] },
    ],
    llmInstructions,
    secret: 'test',
  })

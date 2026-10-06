import type { PayloadRequest, RelationshipField } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { generateLabelFromValue } from './generateLabelFromValue.js'

const field: RelationshipField = {
  name: 'relationship',
  type: 'relationship',
  relationTo: 'posts',
}

const createRequest = ({
  hasDrafts = true,
  canRead = true,
}: {
  canRead?: boolean
  hasDrafts?: boolean
} = {}) => {
  const findByID = vi.fn(async ({ overrideAccess, version }) => {
    if (!canRead && !overrideAccess) {
      throw new Error('Read access denied')
    }

    if (hasDrafts && version !== 'latest') {
      throw new Error('The document is only available as a draft')
    }

    if (!hasDrafts && version && version !== 'published') {
      throw new Error('Draft selectors are not supported')
    }

    return { id: 1, title: 'Related title' }
  })

  const req = {
    i18n: { t: () => 'Untitled' },
    payload: {
      collections: {
        posts: {
          config: {
            admin: { useAsTitle: 'title' },
            fields: [{ name: 'title', type: 'text' }],
            versions: hasDrafts ? { drafts: true } : false,
          },
        },
      },
      findByID,
    },
  } as unknown as PayloadRequest

  return { findByID, req }
}

describe('generateLabelFromValue', () => {
  it('should label a draft-only relationship in a historical version', async () => {
    const { req } = createRequest()

    const label = await generateLabelFromValue({
      field,
      locale: 'en',
      parentIsLocalized: false,
      req,
      value: 1,
    })

    expect(label).toBe('Related title')
  })

  it('should hide the related title when read access is denied', async () => {
    const { req } = createRequest({ canRead: false, hasDrafts: false })

    const label = await generateLabelFromValue({
      field,
      locale: 'en',
      parentIsLocalized: false,
      req,
      value: 1,
    })

    expect(label).toBe('Untitled - ID: 1')
  })

  it('should label a relationship whose collection has no drafts', async () => {
    const { req } = createRequest({ hasDrafts: false })

    const label = await generateLabelFromValue({
      field,
      locale: 'en',
      parentIsLocalized: false,
      req,
      value: 1,
    })

    expect(label).toBe('Related title')
  })
})

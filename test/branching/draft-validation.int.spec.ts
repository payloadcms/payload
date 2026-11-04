import { createPayloadRequest, defaultBranchMergeValidation } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  draftValidationGlobalSlug,
  draftValidationSlug,
  strictDraftValidationSlug,
} from './draft-validation.config.js'
import { branchesSlug } from './shared.js'
import { createTrustedPayload } from './trustedPayload.js'

const branch = 'Incomplete translations'
const incompleteData = {
  content: null,
  details: { label: null },
  items: [{ label: null }],
  layout: [{ blockType: 'text', label: null }],
  title: 'English draft',
}

test.suite('Branching: draft merge validation', { config: './draft-validation.config.ts' }, () => {
  test('should merge an incomplete localized draft without requiring translations', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)

    await payload.create({ collection: branchesSlug, data: { name: branch } })

    const doc = await payload.create({
      branch,
      collection: draftValidationSlug,
      data: incompleteData,
      draft: true,
      locale: 'en',
    })
    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(preview.validationErrors).toEqual([])
    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })
    const merged = await payload.findByID({
      id: doc.id,
      collection: draftValidationSlug,
      draft: true,
      fallbackLocale: false,
      locale: 'fr',
    })

    expect(result.canMerge).toBe(true)
    expect(merged._status).toBe('draft')
    expect(merged.title ?? null).toBeNull()
    expect(merged.content ?? null).toBeNull()

    const english = await payload.findByID({
      id: doc.id,
      collection: draftValidationSlug,
      draft: true,
      locale: 'en',
    })

    expect(english.title).toBe('English draft')
    expect(english.items).toEqual([expect.objectContaining({ label: null })])
  })

  test('should preserve published content when merging a draft that clears required fields', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)
    const doc = await payload.create({
      collection: draftValidationSlug,
      data: {
        _status: 'published',
        title: 'Published English',
        details: { label: 'Published details' },
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Published content',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
      locale: 'en',
    })

    await payload.create({ collection: branchesSlug, data: { name: branch } })
    await payload.update({
      id: doc.id,
      branch,
      collection: draftValidationSlug,
      data: { title: null, content: null },
      draft: true,
      locale: 'en',
    })

    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(preview.validationErrors).toEqual([])

    const result = await payload.branches.merge({ branch })
    const published = await payload.findByID({ id: doc.id, collection: draftValidationSlug })
    const draft = await payload.findByID({
      id: doc.id,
      collection: draftValidationSlug,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
    })

    expect(result.canMerge).toBe(true)
    expect(published.title).toBe('Published English')
    expect(published._status).toBe('published')
    expect(draft.title ?? null).toBeNull()
    expect(draft.content ?? null).toBeNull()
    expect(draft._status).toBe('draft')
  })

  test('should merge an incomplete localized global draft', async ({ payload: instance }) => {
    const payload = createTrustedPayload(instance)

    await payload.create({ collection: branchesSlug, data: { name: branch } })
    await payload.updateGlobal({
      slug: draftValidationGlobalSlug,
      branch,
      data: incompleteData,
      draft: true,
      locale: 'en',
    })

    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(preview.validationErrors).toEqual([])
    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })
    const merged = await payload.findGlobal({
      slug: draftValidationGlobalSlug,
      draft: true,
      locale: 'en',
    })

    expect(result.canMerge).toBe(true)
    expect(merged.title).toBe('English draft')
    expect(merged._status).toBe('draft')
  })

  test('should still reject malformed nonempty draft fields', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const result = await defaultBranchMergeValidation({
      branch,
      candidates: [
        {
          changeID: 'malformed',
          collectionSlug: draftValidationSlug,
          data: { title: 42, content: { root: 42 }, items: [{ label: 42 }] },
          draft: true,
          entityType: 'collection',
          operation: 'create',
        },
      ],
      req,
      target: 'main',
    })

    expect(result).toMatchObject({ valid: false })
    expect(result.errors.map(({ path }) => path)).toEqual(
      expect.arrayContaining(['data.title', 'data.content.root', 'data.items[0].label']),
    )
  })

  test('should still reject null required fields for published and validated drafts', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })

    for (const candidate of [
      { collectionSlug: draftValidationSlug, draft: false },
      { collectionSlug: strictDraftValidationSlug, draft: true },
    ]) {
      const result = await defaultBranchMergeValidation({
        branch,
        candidates: [
          {
            ...candidate,
            changeID: 'required',
            data: { title: null },
            entityType: 'collection',
            operation: 'update',
          },
        ],
        req,
        target: 'main',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'data.title' }))
    }
  })
})

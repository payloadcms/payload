import { createPayloadRequest, defaultBranchMergeValidation } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  draftValidationGlobalSlug,
  draftValidationSlug,
  strictDraftValidationGlobalSlug,
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

  test('should merge two posts published only in English without requiring draft translations', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)

    await payload.create({ collection: branchesSlug, data: { name: branch } })

    const documents = []

    for (const title of ['First post', 'Second post']) {
      documents.push(
        await payload.create({
          branch,
          collection: draftValidationSlug,
          data: {
            _status: 'published',
            title,
            details: { label: 'Details' },
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
        }),
      )
    }

    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(preview.validationErrors).toEqual([])
    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })

    expect(result.merged).toHaveLength(2)

    for (const document of documents) {
      const english = await payload.findByID({
        id: document.id,
        collection: draftValidationSlug,
        locale: 'en',
      })

      expect(english.title).toBe(document.title)
      expect(english._status).toBe('published')

      for (const locale of ['fr', 'de']) {
        const translation = await payload.findByID({
          id: document.id,
          collection: draftValidationSlug,
          locale,
          fallbackLocale: false,
          draft: true,
        })

        expect(translation.title ?? null).toBeNull()
        expect(translation._status).toBe('draft')
      }
    }
  })

  test('should merge published English and an unvalidated French draft without changing their statuses', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)
    const doc = await payload.create({
      collection: draftValidationSlug,
      data: {
        _status: 'published',
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
        details: { label: 'Published details' },
        title: 'Main English',
      },
      locale: 'en',
    })

    await payload.create({ collection: branchesSlug, data: { name: branch } })
    await payload.update({
      id: doc.id,
      branch,
      collection: draftValidationSlug,
      data: { _status: 'published', title: 'Branch English' },
      locale: 'en',
    })
    await payload.update({
      id: doc.id,
      branch,
      collection: draftValidationSlug,
      data: { content: null, metadata: { label: 42 }, title: 'French draft' },
      draft: true,
      locale: 'fr',
    })

    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(preview.validationErrors).toEqual([])
    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })
    const english = await payload.findByID({
      id: doc.id,
      collection: draftValidationSlug,
      fallbackLocale: false,
      locale: 'en',
    })
    const french = await payload.findByID({
      id: doc.id,
      collection: draftValidationSlug,
      draft: true,
      fallbackLocale: false,
      locale: 'fr',
    })
    const publishedFrench = await payload.find({
      collection: draftValidationSlug,
      fallbackLocale: false,
      locale: 'fr',
      where: { and: [{ id: { equals: doc.id } }, { _status: { equals: 'published' } }] },
    })

    expect(result.merged).toHaveLength(1)
    expect(english.title).toBe('Branch English')
    expect(english._status).toBe('published')
    expect(french.title).toBe('French draft')
    expect(french.content ?? null).toBeNull()
    expect(french.metadata).toEqual({ label: 42 })
    expect(french._status).toBe('draft')
    expect(publishedFrench.docs).toHaveLength(0)
  })

  test('should preserve published content when merging an unvalidated draft', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)
    const doc = await payload.create({
      collection: draftValidationSlug,
      data: {
        _status: 'published',
        title: 'Published English',
        metadata: { label: 'Published metadata' },
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
      data: { title: null, content: null, metadata: { label: null } },
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
    expect(published.metadata).toEqual({ label: 'Published metadata' })
    expect(draft.title ?? null).toBeNull()
    expect(draft.content ?? null).toBeNull()
    expect(draft._status).toBe('draft')
    expect(draft.metadata).toEqual({ label: null })
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

  test('should merge saved draft JSON without revalidating its schema', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)

    await payload.create({ collection: branchesSlug, data: { name: branch } })

    const doc = await payload.create({
      branch,
      collection: draftValidationSlug,
      data: { metadata: { label: null }, title: 'English draft' },
      draft: true,
      locale: 'en',
    })
    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(doc.metadata).toEqual({ label: null })
    expect(preview.validationErrors).toEqual([])
    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })
    const merged = await payload.findByID({
      id: doc.id,
      collection: draftValidationSlug,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
    })

    expect(result.merged).toHaveLength(1)
    expect(merged.metadata).toEqual(doc.metadata)
    expect(merged.title).toBe(doc.title)
    expect(merged._status).toBe('draft')
  })

  test('should merge saved global draft JSON without revalidating its schema', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)

    await payload.create({ collection: branchesSlug, data: { name: branch } })

    const source = await payload.updateGlobal({
      slug: draftValidationGlobalSlug,
      branch,
      data: { metadata: { label: 42 }, title: 'English draft' },
      draft: true,
      locale: 'en',
    })
    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(source.metadata).toEqual({ label: 42 })
    expect(preview.validationErrors).toEqual([])
    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })
    const merged = await payload.findGlobal({
      slug: draftValidationGlobalSlug,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
    })

    expect(result.merged).toHaveLength(1)
    expect(merged.metadata).toEqual(source.metadata)
    expect(merged.title).toBe(source.title)
    expect(merged._status).toBe('draft')
  })

  test('should skip structural validation for drafts when draft validation is disabled', async ({
    payload,
  }) => {
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

    expect(result).toEqual({ errors: [], valid: true })
  })

  test('should still reject null required fields for published and validated drafts', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })

    for (const candidate of [
      {
        collectionSlug: draftValidationSlug,
        data: { title: null },
        draft: false,
        entityType: 'collection',
      },
      {
        collectionSlug: draftValidationSlug,
        data: { _status: 'published', title: null },
        draft: true,
        entityType: 'collection',
      },
      {
        collectionSlug: strictDraftValidationSlug,
        data: { title: null },
        draft: true,
        entityType: 'collection',
      },
      {
        globalSlug: draftValidationGlobalSlug,
        data: { title: null },
        draft: false,
        entityType: 'global',
      },
      {
        globalSlug: strictDraftValidationGlobalSlug,
        data: { title: null },
        draft: true,
        entityType: 'global',
      },
    ] as const) {
      const result = await defaultBranchMergeValidation({
        branch,
        candidates: [
          {
            ...candidate,
            changeID: 'required',
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

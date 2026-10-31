import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, localizedSlug, nestedSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: localized-writes-merge',
  { config: './config.ts', resetBetweenTests: false },
  () => {
    test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
      payload = createTrustedPayload(payloadInstance)
      restClient = restClientInstance

      const login = await restClient
        .POST('/users/login', {
          body: JSON.stringify({ email: devUser.email, password: devUser.password }),
        })
        .then((res) => res.json())

      token = login.token
    })

    /**
     * Two shapes the suite could not reach before: a localized field, which forks per
     * locale, and array/block fields, which live in their own tables under Drizzle so a
     * fork has to copy child rows and re-parent them.
     */
    test.describe('Localized and nested fields', () => {
      const branch = 'shapework'

      test.beforeAll(async () => {
        const existing = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: branch } },
        })

        if (!existing.docs.length) {
          await payload.create({
            collection: branchesSlug,
            data: { name: 'Shape work', slug: branch },
          })
        }
      })

      test.afterEach(async () => {
        hookSpy.localizedChangeRows = undefined
        hookSpy.postDefaultValueCount = undefined

        for (const collection of [localizedSlug, nestedSlug] as const) {
          const rows = await payload.find({ branch: false, collection, pagination: false })

          for (const row of rows.docs) {
            await payload.delete({ id: row.id, branch: false, collection }).catch(() => {})
          }
        }

        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branch } },
        })

        for (const change of changes.docs) {
          await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
        }
      })

      test('should merge a localized edit into the right locale only', async () => {
        const doc = await payload.create({
          collection: localizedSlug,
          data: { _status: 'published', title: 'main english' },
          locale: 'en',
        })

        await payload.update({
          id: doc.id,
          collection: localizedSlug,
          data: { _status: 'published', title: 'main spanish' },
          locale: 'es',
        })

        await payload.update({
          id: doc.id,
          branch,
          collection: localizedSlug,
          data: { _status: 'published', title: 'branch spanish' },
          locale: 'es',
        })

        await payload.branches.merge({ branch })

        const mainES = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          locale: 'es',
        })
        const mainEN = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          locale: 'en',
        })

        expect(mainES.title).toBe('branch spanish')
        expect(mainEN.title).toBe('main english')
      })

      test('should preserve one localized nested row across every merged locale', async () => {
        const doc = await payload.create({
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [{ label: 'main English' }],
            title: 'main english',
          },
          locale: 'en',
        })

        await payload.update({
          id: doc.id,
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [{ id: doc.items?.[0]?.id, label: 'main Spanish' }],
            title: 'main spanish',
          },
          locale: 'es',
        })

        await payload.update({
          id: doc.id,
          branch,
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [{ label: 'branch English' }],
            title: 'branch english',
          },
          locale: 'en',
        })

        hookSpy.localizedChangeRows = []

        await payload.branches.merge({ branch })

        const mainEN = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          locale: 'en',
        })
        const mainES = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          locale: 'es',
        })

        expect(mainEN.items?.map((item) => item.label)).toEqual(['branch English'])
        expect(mainES.items?.map((item) => item.label)).toEqual(['main Spanish'])
        expect(mainEN.items?.map((item) => item.id)).toEqual(mainES.items?.map((item) => item.id))
        expect(hookSpy.localizedChangeRows).toHaveLength(2)
        expect(hookSpy.localizedChangeRows?.[0]?.ids).toEqual(hookSpy.localizedChangeRows?.[1]?.ids)
      })

      test('should preserve nested row identity when a later branch draft reorders rows', async () => {
        const doc = await payload.create({
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [{ label: 'main row' }],
            title: 'main',
          },
          locale: 'en',
        })

        const publishedOnBranch = await payload.update({
          id: doc.id,
          branch,
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [{ label: 'first published' }, { label: 'second published' }],
            title: 'published on branch',
          },
          locale: 'en',
        })

        await payload.update({
          id: doc.id,
          branch,
          collection: localizedSlug,
          data: {
            items: [
              { id: publishedOnBranch.items?.[1]?.id, label: 'second draft' },
              { id: publishedOnBranch.items?.[0]?.id, label: 'first draft' },
            ],
            title: 'draft on branch',
          },
          draft: true,
          locale: 'en',
        })

        await payload.branches.merge({ branch })

        const publishedOnMain = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          locale: 'en',
        })
        const draftOnMain = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          draft: true,
          locale: 'en',
        })

        expect(draftOnMain.items?.map((item) => item.label)).toEqual([
          'second draft',
          'first draft',
        ])
        expect(publishedOnMain.items?.map((item) => item.label)).toEqual(['main row'])
        expect(draftOnMain.items?.map((item) => item.id)).toHaveLength(2)
        expect(draftOnMain.items?.every((item) => Boolean(item.id))).toBe(true)
        expect(draftOnMain.items?.map((item) => item.id)).not.toContain(
          publishedOnMain.items?.[0]?.id,
        )
      })

      test('should preserve nested row identity when a later branch draft removes a row', async () => {
        const doc = await payload.create({
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [{ label: 'main row' }],
            title: 'main',
          },
          locale: 'en',
        })

        const publishedOnBranch = await payload.update({
          id: doc.id,
          branch,
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [
              { label: 'first published' },
              { label: 'second published' },
              { label: 'third published' },
            ],
            title: 'published on branch',
          },
          locale: 'en',
        })

        await payload.update({
          id: doc.id,
          branch,
          collection: localizedSlug,
          data: {
            items: [
              { id: publishedOnBranch.items?.[1]?.id, label: 'second draft' },
              { id: publishedOnBranch.items?.[2]?.id, label: 'third draft' },
            ],
            title: 'draft on branch',
          },
          draft: true,
          locale: 'en',
        })

        await payload.branches.merge({ branch })

        const publishedOnMain = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          locale: 'en',
        })
        const draftOnMain = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          draft: true,
          locale: 'en',
        })

        expect(draftOnMain.items?.map((item) => item.label)).toEqual([
          'second draft',
          'third draft',
        ])
        expect(publishedOnMain.items?.map((item) => item.label)).toEqual(['main row'])
        expect(draftOnMain.items?.map((item) => item.id)).toHaveLength(2)
        expect(draftOnMain.items?.every((item) => Boolean(item.id))).toBe(true)
        expect(draftOnMain.items?.map((item) => item.id)).not.toContain(
          publishedOnMain.items?.[0]?.id,
        )
      })

      test('should merge array and block rows into main', async () => {
        const doc = await payload.create({
          collection: nestedSlug,
          data: {
            items: [{ label: 'main one' }, { label: 'main two' }],
            layout: [{ blockType: 'hero', heading: 'main hero' }],
            title: 'nested on main',
          },
        })

        await payload.update({
          id: doc.id,
          branch,
          collection: nestedSlug,
          data: {
            items: [{ label: 'branch one' }],
            layout: [{ blockType: 'hero', heading: 'branch hero' }],
            title: 'nested on branch',
          },
        })

        await payload.branches.merge({ branch })

        const onMain = await payload.findByID({ id: doc.id, collection: nestedSlug })

        expect(onMain.title).toBe('nested on branch')
        expect(onMain.items).toHaveLength(1)
        expect(onMain.items?.[0]?.label).toBe('branch one')
        expect((onMain.layout?.[0] as { heading?: string })?.heading).toBe('branch hero')
      })
    })
  },
)

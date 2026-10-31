import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { readLocalizedBranchWrite } from '../../packages/payload/src/branching/readLocalizedBranchWrite.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, localizedSlug, nestedSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: localized-writes',
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

      test('should fork one locale and leave the others reading main', async () => {
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

        const branchES = await payload.findByID({
          id: doc.id,
          branch,
          collection: localizedSlug,
          locale: 'es',
        })
        const branchEN = await payload.findByID({
          id: doc.id,
          branch,
          collection: localizedSlug,
          locale: 'en',
        })
        const mainES = await payload.findByID({
          id: doc.id,
          collection: localizedSlug,
          locale: 'es',
        })

        expect(branchES.title).toBe('branch spanish')
        // The untouched locale came along in the fork, so it still reads as main's.
        expect(branchEN.title).toBe('main english')
        expect(mainES.title).toBe('main spanish')
      })

      test('should read exact localized merge data without evaluating defaults', async () => {
        const doc = await payload.create({
          collection: localizedSlug,
          data: { _status: 'published', title: 'main english' },
          locale: 'en',
        })

        await payload.update({
          id: doc.id,
          branch,
          collection: localizedSlug,
          data: { _status: 'published', title: 'branch english' },
          locale: 'en',
        })

        hookSpy.postDefaultValueCount = 0

        const branchWrite = await readLocalizedBranchWrite({
          branch,
          collectionSlug: localizedSlug,
          docID: doc.id,
          draft: false,
          locale: 'en',
          payload,
          req: await createPayloadRequest({ branch: false, payload }),
        })

        expect(hookSpy.postDefaultValueCount).toBe(0)
        expect(branchWrite?.computedDefault).toBeUndefined()
      })

      test('should fork array and block rows onto the branch', async () => {
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

        const onBranch = await payload.findByID({ id: doc.id, branch, collection: nestedSlug })
        const onMain = await payload.findByID({ id: doc.id, collection: nestedSlug })

        // Child rows belong to the copy that owns them: replacing them on the branch must
        // not take main's with it, which is the failure a flat-field test cannot see.
        expect(onBranch.items).toHaveLength(1)
        expect(onBranch.items?.[0]?.label).toBe('branch one')
        expect((onBranch.layout?.[0] as { heading?: string })?.heading).toBe('branch hero')

        expect(onMain.items).toHaveLength(2)
        expect(onMain.items?.map((item) => item.label)).toEqual(['main one', 'main two'])
        expect((onMain.layout?.[0] as { heading?: string })?.heading).toBe('main hero')
      })
    })
  },
)

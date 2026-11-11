import { de } from '@payloadcms/translations/languages/de'
import { createPayloadRequest, ValidationError } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import { branchChangesSlug, branchesSlug, postsSlug, uniqueSlug } from './shared.js'

test.suite('Branching: write-time merge errors', { config: './config.ts', db: 'all' }, () => {
  test.afterEach(() => {
    hookSpy.beforeChange = undefined
  })

  for (const isStream of [true, false]) {
    test(`should hide unexpected database failures (stream: ${isStream})`, async ({
      payload,
      restClient,
    }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Database failure review' },
        overrideAccess: true,
      })

      await payload.create({
        branch: branch.name,
        collection: uniqueSlug,
        data: { slug: 'valid-slug' },
        overrideAccess: true,
      })
      await restClient.login({ slug: 'users' })

      const error = new Error('Database failure: private connection and query details')
      const updateOne = payload.db.updateOne.bind(payload.db)
      const updateSpy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
        if (args.collection === uniqueSlug) {
          throw error
        }

        return updateOne(args)
      })
      const logSpy = vi.spyOn(payload.logger, 'error').mockImplementation(() => {})

      const previousDebug = payload.config.debug

      payload.config.debug = true

      try {
        const response = await restClient.POST(`/${branchesSlug}/${branch.id}/merge`, {
          body: JSON.stringify({ stream: isStream }),
        })
        const body = await readFailure({ isStream, response })

        expect(response.status).toBe(isStream ? 200 : 500)
        expect(body).toMatchObject({ type: 'error', message: 'An unknown error has occurred.' })
        expect(body).not.toHaveProperty('stack')
        expect(body).not.toHaveProperty('validationErrors')
        expect(JSON.stringify(body)).not.toContain(error.message)
        expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ err: error }))
      } finally {
        payload.config.debug = previousDebug
        updateSpy.mockRestore()
        logSpy.mockRestore()
      }
    })

    test(`should return actionable errors for a real uniqueness conflict (stream: ${isStream})`, async ({
      payload,
      restClient,
    }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Write failure review' },
        overrideAccess: true,
      })
      const main = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'conflicting-slug' },
        overrideAccess: true,
      })
      const doc = await payload.create({
        branch: branch.name,
        collection: uniqueSlug,
        data: { slug: 'conflicting-slug' },
        overrideAccess: true,
      })
      const { docs: users } = await payload.find({
        collection: 'users',
        overrideAccess: true,
        where: { email: { equals: devUser.email } },
      })
      const req = await createPayloadRequest({ payload, user: users[0] })
      const preview = await payload.branches.merge({ branch: branch.name, dryRun: true, req })

      expect(preview.canMerge).toBe(true)
      expect(preview.validationErrors).toEqual([])

      await restClient.login({ slug: 'users' })

      const changes = await payload.find({
        collection: branchChangesSlug,
        overrideAccess: true,
        where: { branch: { equals: branch.name } },
      })
      const response = await restClient.POST(`/${branchesSlug}/${branch.id}/merge`, {
        body: JSON.stringify({ stream: isStream }),
      })
      const body = await readFailure({ isStream, response })

      expect(body).toMatchObject({
        type: 'error',
        message: req.t('error:correctInvalidFields'),
        validationErrors: [
          expect.objectContaining({
            collectionSlug: uniqueSlug,
            message: req.t('error:valueMustBeUnique'),
            path: 'slug',
          }),
        ],
      })
      expect(String(body.validationErrors[0].docID)).toBe(String(doc.id))
      expect(String(body.validationErrors[0].changeID)).toBe(String(changes.docs[0]!.id))
      expect(body).not.toHaveProperty('result')
      expect(response.status).toBe(isStream ? 200 : 400)
      expect(body.errors?.[0].data.errors ?? body.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: req.t('error:valueMustBeUnique'), path: 'slug' }),
        ]),
      )

      const mainAfter = await payload.findByID({
        id: main.id,
        collection: uniqueSlug,
        overrideAccess: true,
      })
      const pending = await payload.find({
        collection: branchChangesSlug,
        overrideAccess: true,
        where: { branch: { equals: branch.name } },
      })

      expect(mainAfter.slug).toBe('conflicting-slug')
      expect(pending.totalDocs).toBeGreaterThan(0)
    })

    test(`should retain localized write errors and source context (stream: ${isStream})`, async ({
      payload,
      restClient,
    }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Localized write failure' },
        overrideAccess: true,
      })
      const doc = await payload.create({
        branch: branch.name,
        collection: postsSlug,
        data: { title: 'Source document' },
        overrideAccess: true,
      })
      const changes = await payload.find({
        collection: branchChangesSlug,
        overrideAccess: true,
        where: { branch: { equals: branch.name } },
      })

      await restClient.login({ slug: 'users' })

      hookSpy.beforeChange = ({ req }) => {
        throw new ValidationError({
          collection: postsSlug,
          errors: [
            {
              label: { en: 'Title', de: 'Titel' },
              locale: 'es',
              message: 'Write-time validation failed',
              path: 'title',
            },
          ],
          req,
        })
      }

      const response = await restClient.POST(`/${branchesSlug}/${branch.id}/merge`, {
        body: JSON.stringify({ stream: isStream }),
        headers: { 'Accept-Language': 'de' },
      })
      const body = await readFailure({ isStream, response })

      expect(response.status).toBe(isStream ? 200 : 400)
      expect(body).toMatchObject({
        type: 'error',
        message: de.translations.error.correctInvalidFields,
        validationErrors: [
          {
            collectionSlug: postsSlug,
            locale: 'es',
            message: 'Write-time validation failed',
            path: 'title',
          },
        ],
      })
      expect(String(body.validationErrors[0].docID)).toBe(String(doc.id))
      expect(String(body.validationErrors[0].changeID)).toBe(String(changes.docs[0]!.id))
      expect(body.errors?.[0].data.errors[0].message ?? body.validationErrors[0].message).toBe(
        'Write-time validation failed',
      )
    })

    for (const isSameCollection of [true, false]) {
      test(`should retain nested error identity (same collection: ${isSameCollection}, stream: ${isStream})`, async ({
        payload,
        restClient,
      }) => {
        const branch = await payload.create({
          collection: branchesSlug,
          data: { name: 'Nested write failure' },
          overrideAccess: true,
        })
        const nested = await payload.create({
          collection: postsSlug,
          data: { title: 'Nested document', order: 1 },
          overrideAccess: true,
        })

        await payload.create({
          collection: uniqueSlug,
          data: { slug: 'nested-conflict' },
          overrideAccess: true,
        })
        await payload.create({
          branch: branch.name,
          collection: postsSlug,
          data: { title: 'Source document' },
          overrideAccess: true,
        })
        await restClient.login({ slug: 'users' })

        hookSpy.beforeChange = async ({ data, originalDoc, req }) => {
          if (originalDoc.id === nested.id) {
            throw new ValidationError({
              id: nested.id,
              collection: postsSlug,
              errors: [{ message: 'Nested write validation failed', path: 'order' }],
              req,
            })
          }

          if (data.title !== 'Source document') {
            return
          }

          if (isSameCollection) {
            await payload.update({
              id: nested.id,
              branch: false,
              collection: postsSlug,
              data: { order: 2 },
              overrideAccess: false,
              req,
            })
          } else {
            await payload.create({
              branch: false,
              collection: uniqueSlug,
              data: { slug: 'nested-conflict' },
              overrideAccess: false,
              req,
            })
          }
        }

        const response = await restClient.POST(`/${branchesSlug}/${branch.id}/merge`, {
          body: JSON.stringify({ stream: isStream }),
        })
        const body = await readFailure({ isStream, response })
        const [error] = body.validationErrors

        expect(response.status).toBe(isStream ? 200 : 400)
        expect(body.type).toBe('error')
        expect(error.collectionSlug).toBe(isSameCollection ? postsSlug : uniqueSlug)
        expect(error.path).toBe(isSameCollection ? 'order' : 'slug')
        expect(error.changeID).toBeUndefined()
        expect(error.docID === undefined ? undefined : String(error.docID)).toBe(
          isSameCollection ? String(nested.id) : undefined,
        )
      })
    }
  }
})

const readFailure = async ({ response, isStream }: { isStream: boolean; response: Response }) => {
  if (!isStream) {
    return response.json()
  }

  const events = (await response.text())
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))

  expect(events.some((event) => event.type === 'complete')).toBe(false)

  return events.at(-1)
}

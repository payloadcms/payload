import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { branchChangesSlug, branchesSlug, uniqueSlug } from './shared.js'

test.suite('Branching: write-time merge errors', { config: './config.ts' }, () => {
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

      try {
        const response = await restClient.POST(`/${branchesSlug}/${branch.id}/merge`, {
          body: JSON.stringify({ stream: isStream }),
        })
        const body = isStream
          ? (await response.text())
              .trim()
              .split('\n')
              .map((line) => JSON.parse(line))
              .at(-1)
          : await response.json()

        expect(response.status).toBe(isStream ? 200 : 500)
        expect(body).toMatchObject({ type: 'error', message: 'An unknown error has occurred.' })
        expect(body).not.toHaveProperty('validationErrors')
        expect(JSON.stringify(body)).not.toContain(error.message)
        expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ err: error }))
      } finally {
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

      const response = await restClient.POST(`/${branchesSlug}/${branch.id}/merge`, {
        body: JSON.stringify({ stream: isStream }),
      })
      const body = isStream
        ? (await response.text())
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line))
            .at(-1)
        : await response.json()

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
  }
})

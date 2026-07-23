import type { Payload, PayloadRequest } from 'payload'

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  accessEvents,
  clearValidationEvents,
  getLocalePassRequestCount,
  getMaximumActiveLocalePasses,
  hookEvents,
  localePassEvents,
  publishCollectionSlug,
  publishGlobalSlug,
  validationCollectionSlug,
  validationGlobalSlug,
  validationUploadsDir,
  validationUploadsSlug,
  writeTargetsSlug,
} from './config.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('validate Local API', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await payload.updateGlobal({
      slug: validationGlobalSlug,
      data: {
        location: [-0.12, 51.5],
        summary: 'stored global summary',
        title: 'Stored global title',
      },
      locale: 'en',
    })
  })

  beforeEach(() => {
    clearValidationEvents()
  })

  afterEach(async () => {
    await Promise.all([
      payload.delete({
        collection: publishCollectionSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationCollectionSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationUploadsSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: writeTargetsSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
    ])
    await fs.rm(validationUploadsDir, { force: true, recursive: true })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('collections', () => {
    it('should expose required localization metadata after config sanitization', () => {
      expect(payload.config.localization && payload.config.localization.locales).toMatchObject([
        { code: 'en', required: false },
        { code: 'es', required: true },
        { code: 'de', required: false },
        { code: 'fr', required: false },
      ])
    })

    it('should validate explicit locales and tag only the invalid locale', async () => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          summary: 'stored summary',
          title: 'English title',
        },
        locale: 'en',
      })
      const result = await payload.validate({
        id: stored.id,
        collection: validationCollectionSlug,
        locale: ['en', 'es'],
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'es',
            path: 'title',
          },
        ],
        valid: false,
      })
    })

    it('should resolve all to every available locale through locale filtering', async () => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          availableLocaleCodes: ['en', 'de'],
          trackLocalePasses: true,
        },
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'all',
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
      expect(localePassEvents.map(({ localeAtStart }) => localeAtStart)).toEqual(['en', 'de'])
    })

    it('should deduplicate explicit locales in deterministic order', async () => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          trackLocalePasses: true,
        },
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: ['es', 'en', 'es'],
      })

      expect(result.valid).toBe(true)
      expect(localePassEvents.map(({ localeAtStart }) => localeAtStart)).toEqual(['es', 'en'])
    })

    it('should reject empty, unknown, and unavailable locale selectors', async () => {
      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: [],
        }),
      ).rejects.toThrow('Validation requires a locale')

      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: ['en', 'unknown'],
        } as never),
      ).rejects.toThrow('unknown')

      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          context: {
            availableLocaleCodes: ['en'],
          },
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: ['en', 'es'],
        }),
      ).rejects.toThrow('es')
    })

    it('should cap concurrent locale passes at three with isolated request state', async () => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          trackLocalePasses: true,
        },
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'all',
      })

      expect(result.valid).toBe(true)
      expect(getMaximumActiveLocalePasses()).toBe(3)
      expect(getLocalePassRequestCount()).toBe(4)
      expect(localePassEvents).toHaveLength(4)
      expect(
        localePassEvents.every(
          ({ localeAtEnd, localeAtStart, operationAtEnd, operationAtStart }) =>
            localeAtEnd === `mutated-${localeAtStart}` &&
            operationAtEnd === 'update' &&
            operationAtStart === 'validate',
        ),
      ).toBe(true)
    })

    it('should return field errors for invalid create data without creating a document', async () => {
      const req = {
        operation: 'update',
      } satisfies Partial<PayloadRequest>
      const result = await payload.validate({
        collection: validationCollectionSlug,
        data: {
          summary: 'candidate summary',
          title: '',
        },
        locale: 'en',
        req,
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'title',
          },
        ],
        valid: false,
      })
      expect(await payload.count({ collection: validationCollectionSlug })).toEqual({
        totalDocs: 0,
      })
      expect(req.operation).toBe('update')
    })

    it('should return a successful result for valid create data', async () => {
      const req = {
        operation: 'read',
      } satisfies Partial<PayloadRequest>
      const result = await payload.validate({
        collection: validationCollectionSlug,
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'en',
        req,
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
      expect(req.operation).toBe('read')
    })

    it('should run validation hooks in order with the validate operation and unchanged context', async () => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          marker: 'caller context',
        },
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'en',
      })

      expect(result.valid).toBe(true)
      expect(hookEvents.map(({ hook }) => hook)).toEqual([
        'fieldBeforeValidate',
        'collectionBeforeValidate',
        'collectionBeforeChange',
        'fieldBeforeChange',
        'fieldValidate',
      ])
      expect(hookEvents.every(({ operation }) => operation === 'validate')).toBe(true)
      expect(hookEvents.every(({ requestOperation }) => requestOperation === 'validate')).toBe(true)
      expect(
        hookEvents.every(
          ({ context }) =>
            context.marker === 'caller context' &&
            !('dryRun' in context) &&
            !('isValidateOnly' in context),
        ),
      ).toBe(true)
    })

    it('should apply defaults before validating required fields', async () => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'en',
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
      expect(hookEvents.find(({ hook }) => hook === 'fieldValidate')).toBeDefined()
    })

    it('should reject create simulation without data at runtime', async () => {
      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          locale: 'en',
        } as never),
      ).rejects.toThrow('Validation create simulation requires data')
    })

    it('should reject a missing locale at runtime', async () => {
      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
        } as never),
      ).rejects.toThrow('Validation requires a locale')
    })

    it('should merge partial update data over the stored locale without persisting it', async () => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          location: [-0.12, 51.5],
          summary: 'stored summary',
          title: 'Stored title',
        },
        locale: 'en',
      })

      const result = await payload.validate({
        id: stored.id,
        collection: validationCollectionSlug,
        data: {
          summary: 'candidate summary',
        },
        locale: 'en',
      })
      const afterValidation = await payload.findByID({
        id: stored.id,
        collection: validationCollectionSlug,
        locale: 'en',
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
      expect(afterValidation).toMatchObject({
        location: [-0.12, 51.5],
        summary: 'stored summary',
        title: 'Stored title',
      })
    })

    it('should validate a partial update with an unchanged stored point representation', async () => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          location: [-73.9857, 40.7484],
          summary: 'stored summary',
          title: 'Stored title',
        },
        locale: 'en',
      })

      const result = await payload.validate({
        id: stored.id,
        collection: validationCollectionSlug,
        data: {
          summary: 'candidate summary',
        },
        locale: 'en',
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    it('should execute first-class collection validation access and throw on denial', async () => {
      const req = {
        operation: 'delete',
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
          req,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      expect(accessEvents).toEqual(['collection'])
      expect(req.operation).toBe('delete')
    })

    it('should restore the caller request operation after a collection hook throws', async () => {
      const req = {
        operation: 'create',
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          context: {
            throwValidationHook: true,
          },
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: 'en',
          req,
        }),
      ).rejects.toThrow('collection validation hook failure')

      expect(req.operation).toBe('create')
    })
  })

  describe('globals', () => {
    it('should validate valid partial global data without persisting it', async () => {
      const req = {
        operation: 'read',
      } satisfies Partial<PayloadRequest>
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        data: {
          summary: 'candidate summary',
        },
        locale: 'en',
        req,
      })
      const afterValidation = await payload.findGlobal({
        slug: validationGlobalSlug,
        locale: 'en',
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
      expect(afterValidation).toMatchObject({
        location: [-0.12, 51.5],
        summary: 'stored global summary',
        title: 'Stored global title',
      })
      expect(req.operation).toBe('read')
    })

    it('should return errors for invalid partial global data without persisting it', async () => {
      const req = {
        operation: 'update',
      } satisfies Partial<PayloadRequest>
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        data: {
          title: '',
        },
        locale: 'en',
        req,
      })
      const afterValidation = await payload.findGlobal({
        slug: validationGlobalSlug,
        locale: 'en',
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'title',
          },
        ],
        valid: false,
      })
      expect(afterValidation.title).toBe('Stored global title')
      expect(req.operation).toBe('update')
    })

    it('should validate partial global data with an unchanged stored point representation', async () => {
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        data: {
          summary: 'candidate summary',
        },
        locale: 'en',
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    it('should execute first-class global validation access and throw on denial', async () => {
      const req = {
        operation: 'delete',
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validateGlobal({
          slug: validationGlobalSlug,
          locale: 'en',
          overrideAccess: false,
          req,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      expect(accessEvents).toEqual(['global'])
      expect(req.operation).toBe('delete')
    })

    it('should restore the caller request operation after a global hook throws', async () => {
      const req = {
        operation: 'create',
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validateGlobal({
          slug: validationGlobalSlug,
          context: {
            throwValidationHook: true,
          },
          locale: 'en',
          req,
        }),
      ).rejects.toThrow('global validation hook failure')

      expect(req.operation).toBe('create')
    })
  })

  describe('REST API', () => {
    it('should return invalid collection create validation without creating a document', async () => {
      const response = await restClient.POST(`/${validationCollectionSlug}/validate?locale=en`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: '',
        }),
      })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'title',
          },
        ],
        valid: false,
      })
      expect(await payload.count({ collection: validationCollectionSlug })).toEqual({
        totalDocs: 0,
      })
    })

    it('should return valid collection create validation', async () => {
      const response = await restClient.POST(`/${validationCollectionSlug}/validate?locale=en`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
    })

    it('should return 400 for missing or empty locales and malformed data', async () => {
      const missingLocale = await restClient.POST(`/${validationCollectionSlug}/validate`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
      })
      const emptyLocale = await restClient.POST(`/${validationCollectionSlug}/validate?locale=`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
      })
      const malformedData = await restClient.POST(
        `/${validationCollectionSlug}/validate?locale=en`,
        {
          body: JSON.stringify([]),
        },
      )
      const malformedJSON = await restClient.POST(
        `/${validationCollectionSlug}/validate?locale=en`,
        {
          body: '{ invalid json',
        },
      )

      expect(missingLocale.status).toBe(400)
      expect(emptyLocale.status).toBe(400)
      expect(malformedData.status).toBe(400)
      expect(malformedJSON.status).toBe(400)
    })

    it('should accept repeated and all locale selectors', async () => {
      const repeatedLocale = await restClient.POST(
        `/${validationCollectionSlug}/validate?locale=en&locale=es`,
        {
          body: JSON.stringify({
            summary: 'candidate summary',
            title: 'Candidate title',
          }),
        },
      )
      const allLocales = await restClient.POST(`/${validationCollectionSlug}/validate?locale=all`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
      })

      expect(repeatedLocale.status).toBe(200)
      await expect(repeatedLocale.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
      expect(allLocales.status).toBe(200)
      await expect(allLocales.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
    })

    it('should merge by-ID validation data without persisting it', async () => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          location: [-0.12, 51.5],
          summary: 'stored summary',
          title: 'Stored title',
        },
        locale: 'en',
      })
      const response = await restClient.POST(
        `/${validationCollectionSlug}/${stored.id}/validate?locale=en`,
        {
          body: JSON.stringify({
            summary: 'candidate summary',
          }),
        },
      )
      const afterValidation = await payload.findByID({
        id: stored.id,
        collection: validationCollectionSlug,
        locale: 'en',
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
      expect(afterValidation).toMatchObject({
        location: [-0.12, 51.5],
        summary: 'stored summary',
        title: 'Stored title',
      })
    })

    it('should validate global data without persisting it', async () => {
      const response = await restClient.POST(
        `/globals/${validationGlobalSlug}/validate?locale=en`,
        {
          body: JSON.stringify({
            title: '',
          }),
        },
      )
      const afterValidation = await payload.findGlobal({
        slug: validationGlobalSlug,
        locale: 'en',
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'title',
          },
        ],
        valid: false,
      })
      expect(afterValidation.title).toBe('Stored global title')
    })

    it('should return valid global validation without persisting it', async () => {
      const response = await restClient.POST(
        `/globals/${validationGlobalSlug}/validate?locale=en`,
        {
          body: JSON.stringify({
            summary: 'candidate summary',
          }),
        },
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
    })

    it('should deny validation when access.validate returns false', async () => {
      const collection = payload.collections[validationCollectionSlug]!
      const validate = collection.config.access.validate

      collection.config.access.validate = () => false

      const response = await restClient.POST(`/${validationCollectionSlug}/validate?locale=en`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
      })

      collection.config.access.validate = validate

      expect(response.status).toBe(403)
    })

    it('should keep body control-shaped fields as data without changing trusted access inputs', async () => {
      const collection = payload.collections[validationCollectionSlug]!
      const validate = collection.config.access.validate
      const accessRequests: unknown[] = []

      collection.config.access.validate = ({ data, req }) => {
        accessRequests.push({
          context: req.context,
          data,
          operation: req.operation,
          user: req.user,
        })

        return (
          req.user?.email === 'trusted@example.com' &&
          req.context.allowValidation === true &&
          req.operation === 'validate'
        )
      }

      const deniedResponse = await restClient.POST(
        `/${validationCollectionSlug}/validate?locale=en`,
        {
          body: JSON.stringify({
            context: { allowValidation: true },
            operation: 'validate',
            overrideAccess: true,
            req: {
              context: { allowValidation: true },
              operation: 'validate',
              user: { email: 'trusted@example.com' },
            },
            summary: 'candidate summary',
            title: 'Candidate title',
            user: { email: 'trusted@example.com' },
          }),
        },
      )

      collection.config.access.validate = validate

      expect(deniedResponse.status).toBe(403)
      expect(accessRequests).toEqual([
        {
          context: {},
          data: {
            context: { allowValidation: true },
            operation: 'validate',
            overrideAccess: true,
            req: {
              context: { allowValidation: true },
              operation: 'validate',
              user: { email: 'trusted@example.com' },
            },
            summary: 'candidate summary',
            title: 'Candidate title',
            user: { email: 'trusted@example.com' },
          },
          operation: 'validate',
          user: null,
        },
      ])
    })
  })

  describe('write safety', () => {
    it('should reject a create that reuses the validation request before a row is written', async () => {
      await expect(runWriteAttempt('create')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: writeTargetsSlug })).toEqual({ totalDocs: 0 })
    })

    it('should reject an update that reuses the validation request before a row is written', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('update', target.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
        }),
      ).resolves.toMatchObject({
        title: 'stored target',
      })
    })

    it('should reject a delete that reuses the validation request before a row is removed', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('delete', target.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
        }),
      ).resolves.toMatchObject({
        title: 'stored target',
      })
    })

    it('should reject an upload that reuses the validation request before a row or file is written', async () => {
      await fs.mkdir(validationUploadsDir, { recursive: true })

      await expect(runWriteAttempt('upload')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: validationUploadsSlug })).toEqual({ totalDocs: 0 })
      await expect(fs.stat(path.join(validationUploadsDir, 'blocked.txt'))).rejects.toThrow()
    })

    it('should reject a version save that reuses the validation request before a version is written', async () => {
      const target = await createWriteTarget()
      const versionsBefore = await payload.countVersions({
        collection: writeTargetsSlug,
        where: {
          parent: {
            equals: target.id,
          },
        },
      })

      await expect(runWriteAttempt('version', target.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      const versionsAfter = await payload.countVersions({
        collection: writeTargetsSlug,
        where: {
          parent: {
            equals: target.id,
          },
        },
      })
      expect(versionsAfter).toEqual(versionsBefore)
    })
  })

  describe('publish enforcement', () => {
    it('should block collection publish when a required locale is invalid without changing status', async () => {
      const draft = await seedPublishCollection({
        de: '',
        en: 'English draft',
        es: '',
      })
      const versionsBefore = await payload.countVersions({
        collection: publishCollectionSlug,
        where: {
          parent: {
            equals: draft.id,
          },
        },
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: {
            _status: 'published',
            title: 'English published',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [
            {
              locale: 'es',
              path: 'title',
            },
          ],
        },
      })

      const latestDraft = await payload.findByID({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: true,
        locale: 'all',
      })
      const versionsAfter = await payload.countVersions({
        collection: publishCollectionSlug,
        where: {
          parent: {
            equals: draft.id,
          },
        },
      })

      expect(latestDraft._status.en).toBe('draft')
      expect(versionsAfter).toEqual(versionsBefore)
    })

    it('should allow collection publish when only an optional non-current locale is invalid', async () => {
      const draft = await seedPublishCollection({
        de: '',
        en: 'English draft',
        es: 'Spanish required',
      })

      await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          _status: 'published',
          title: 'English published',
        },
        locale: 'en',
      })

      const published = await payload.findByID({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: true,
        locale: 'all',
      })

      expect(published._status.en).toBe('published')
    })

    it('should block collection publish-all when an optional locale is invalid', async () => {
      const draft = await seedPublishCollection({
        de: '',
        en: 'English draft',
        es: 'Spanish required',
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: {
            _status: 'published',
            title: 'English published',
          },
          locale: 'en',
          publishAllLocales: true,
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'de',
              path: 'title',
            }),
          ]),
        },
      })

      const latestDraft = await payload.findByID({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: true,
        locale: 'all',
      })

      expect(latestDraft._status.en).toBe('draft')
    })

    it('should block global publish when a required locale is invalid without changing status', async () => {
      await seedPublishGlobal({
        de: '',
        en: 'English draft',
        es: '',
      })
      const versionsBefore = await payload.countGlobalVersions({
        global: publishGlobalSlug,
      })

      await expect(
        payload.updateGlobal({
          slug: publishGlobalSlug,
          data: {
            _status: 'published',
            title: 'English published',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [
            {
              locale: 'es',
              path: 'title',
            },
          ],
        },
      })

      const latestDraft = await payload.findGlobal({
        slug: publishGlobalSlug,
        draft: true,
        locale: 'all',
      })
      const versionsAfter = await payload.countGlobalVersions({
        global: publishGlobalSlug,
      })

      expect(latestDraft._status.en).toBe('draft')
      expect(versionsAfter).toEqual(versionsBefore)
    })

    it('should allow global publish when only an optional non-current locale is invalid', async () => {
      await seedPublishGlobal({
        de: '',
        en: 'English draft',
        es: 'Spanish required',
      })

      await payload.updateGlobal({
        slug: publishGlobalSlug,
        data: {
          _status: 'published',
          title: 'English published',
        },
        locale: 'en',
      })

      const published = await payload.findGlobal({
        slug: publishGlobalSlug,
        draft: true,
        locale: 'all',
      })

      expect(published._status.en).toBe('published')
    })

    it('should block global publish-all when an optional locale is invalid', async () => {
      await seedPublishGlobal({
        de: '',
        en: 'English draft',
        es: 'Spanish required',
      })

      await expect(
        payload.updateGlobal({
          slug: publishGlobalSlug,
          data: {
            _status: 'published',
            title: 'English published',
          },
          locale: 'en',
          publishAllLocales: true,
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'de',
              path: 'title',
            }),
          ]),
        },
      })

      const latestDraft = await payload.findGlobal({
        slug: publishGlobalSlug,
        draft: true,
        locale: 'all',
      })

      expect(latestDraft._status.en).toBe('draft')
    })
  })
})

async function createWriteTarget() {
  return payload.create({
    collection: writeTargetsSlug,
    data: {
      title: 'stored target',
    },
    disableTransaction: true,
  })
}

async function runWriteAttempt(
  writeAttempt: 'create' | 'delete' | 'update' | 'upload' | 'version',
  targetID?: number | string,
) {
  return payload.validate({
    collection: validationCollectionSlug,
    data: {
      summary: 'candidate summary',
      targetID: targetID?.toString(),
      title: 'Candidate title',
      writeAttempt,
    },
    locale: 'en',
  })
}

async function seedPublishCollection({ de, en, es }: { de: string; en: string; es: string }) {
  const draft = await payload.create({
    collection: publishCollectionSlug,
    data: {
      title: en,
    },
    draft: true,
    locale: 'en',
  })

  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: {
      title: es,
    },
    draft: true,
    locale: 'es',
  })
  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: {
      title: de,
    },
    draft: true,
    locale: 'de',
  })

  return draft
}

async function seedPublishGlobal({ de, en, es }: { de: string; en: string; es: string }) {
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: {},
    unpublishAllLocales: true,
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: {
      title: en,
    },
    draft: true,
    locale: 'en',
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: {
      title: es,
    },
    draft: true,
    locale: 'es',
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: {
      title: de,
    },
    draft: true,
    locale: 'de',
  })
}

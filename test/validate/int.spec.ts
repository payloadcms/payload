import type { Payload } from 'payload'

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  accessEvents,
  clearValidationEvents,
  hookEvents,
  validationCollectionSlug,
  validationGlobalSlug,
  validationUploadsDir,
  validationUploadsSlug,
  writeTargetsSlug,
} from './config.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('validate Local API', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))

    await payload.updateGlobal({
      slug: validationGlobalSlug,
      data: {
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
    it('should return field errors for invalid create data without creating a document', async () => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        data: {
          summary: 'candidate summary',
          title: '',
        },
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
      expect(await payload.count({ collection: validationCollectionSlug })).toEqual({
        totalDocs: 0,
      })
    })

    it('should return a successful result for valid create data', async () => {
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
        summary: 'stored summary',
        title: 'Stored title',
      })
    })

    it('should execute first-class collection validation access and throw on denial', async () => {
      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      expect(accessEvents).toEqual(['collection'])
    })
  })

  describe('globals', () => {
    it('should validate valid partial global data without persisting it', async () => {
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        data: {
          summary: 'candidate summary',
        },
        locale: 'en',
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
        summary: 'stored global summary',
        title: 'Stored global title',
      })
    })

    it('should return errors for invalid partial global data without persisting it', async () => {
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        data: {
          title: '',
        },
        locale: 'en',
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
    })

    it('should execute first-class global validation access and throw on denial', async () => {
      await expect(
        payload.validateGlobal({
          slug: validationGlobalSlug,
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      expect(accessEvents).toEqual(['global'])
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

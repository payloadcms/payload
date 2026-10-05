import type { Payload, PayloadRequest } from 'payload'

import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { createPayloadRequest, ValidationError } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  accessEvents,
  clearValidationEvents,
  fallbackAccessEvents,
  getLocalePassRequestCount,
  getMaximumActiveLocalePasses,
  globalValidationSourceEvents,
  graphqlValidationTransactionEvents,
  hookEvents,
  isolationEvents,
  localeFilterOperationEvents,
  localePassEvents,
  permissionOperationEvents,
  scheduledValidationEvents,
  validationRuntimeIdentityEvents,
} from './events.js'
import {
  publishCollectionSlug,
  publishGlobalSlug,
  validationAccessSourceGlobalSlug,
  validationAuthCollectionSlug,
  validationCollectionSlug,
  validationDeniedCollectionSlug,
  validationDeniedGlobalSlug,
  validationDraftSourceGlobalSlug,
  validationFallbackCollectionSlug,
  validationFallbackGlobalSlug,
  validationGlobalSlug,
  validationNonLocalizedCollectionSlug,
  validationTempFilesDir,
  validationUniqueCollectionSlug,
  validationUploadsDir,
  validationUploadsSlug,
  validationWhereCollectionSlug,
  validationWriteTargetGlobalSlug,
  writeTargetsSlug,
} from './shared.js'

const formatGraphQLID = ({ id, payload }: { id: number | string; payload: Payload }) =>
  payload.db.defaultIDType === 'number' ? id : `"${id}"`

function buildNestedFieldValidateBlockRichText(value: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'block',
          fields: {
            id: 'nested-field-validate-block',
            blockType: 'nestedFieldValidateBlock',
            value,
          },
          format: '',
          version: 2,
        },
      ],
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

test.suite('validate Local API', { config: './config.ts' }, () => {
  test.beforeEach(async () => {
    clearValidationEvents()
    await fs.rm(validationTempFilesDir, { force: true, recursive: true })
  })

  test.afterEach(async () => {
    await fs.rm(validationTempFilesDir, { force: true, recursive: true })
  })

  test.describe('collections', () => {
    test('should not add locale metadata to normal create validation errors', async ({
      payload,
    }) => {
      let validationError: unknown

      try {
        await payload.create({
          collection: publishCollectionSlug,
          data: {
            ...getPublishCollectionLocaleData({ title: '' }),
            localizedArray: 'invalid',
          } as never,
          locale: 'en',
          overrideAccess: true,
        })
      } catch (error) {
        validationError = error
      }

      expect(validationError).toBeInstanceOf(ValidationError)
      expect((validationError as ValidationError).data.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'localizedArray' }),
          expect.objectContaining({ path: 'title' }),
        ]),
      )
      expect(
        (validationError as ValidationError).data.errors.every(
          (fieldError) => fieldError.locale === undefined,
        ),
      ).toBe(true)
      expect((validationError as ValidationError).message).not.toContain('[en]')
    })

    test('should not add locale metadata to normal update validation errors', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: publishCollectionSlug,
        data: getPublishCollectionLocaleData({ title: 'Stored title' }),
        locale: 'en',
        overrideAccess: true,
      })
      let validationError: unknown

      try {
        await payload.update({
          id: stored.id,
          collection: publishCollectionSlug,
          data: {
            localizedArray: 'invalid',
            title: '',
          } as never,
          locale: 'en',
          overrideAccess: true,
        })
      } catch (error) {
        validationError = error
      }

      expect(validationError).toBeInstanceOf(ValidationError)
      expect((validationError as ValidationError).data.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'localizedArray' }),
          expect.objectContaining({ path: 'title' }),
        ]),
      )
      expect(
        (validationError as ValidationError).data.errors.every(
          (fieldError) => fieldError.locale === undefined,
        ),
      ).toBe(true)
      expect((validationError as ValidationError).message).not.toContain('[en]')
    })

    test('should report a configured unique field conflict', async ({ payload }) => {
      await payload.create({
        collection: validationUniqueCollectionSlug,
        data: {
          uniqueValue: 'already-used',
        },
        overrideAccess: true,
      })

      const result = await payload.validate({
        collection: validationUniqueCollectionSlug,
        data: {
          uniqueValue: ' already-used ',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toMatchObject({
        errors: [
          {
            path: 'uniqueValue',
          },
        ],
        valid: false,
      })
    })

    test('should report a unique field conflict with a trashed document', async ({ payload }) => {
      const storedDocument = await payload.create({
        collection: validationUniqueCollectionSlug,
        data: {
          uniqueValue: 'trashed-unique-value',
        },
        overrideAccess: true,
      })

      await payload.update({
        id: storedDocument.id,
        collection: validationUniqueCollectionSlug,
        data: {
          deletedAt: new Date().toISOString(),
        } as never,
        overrideAccess: true,
      })

      const result = await payload.validate({
        collection: validationUniqueCollectionSlug,
        data: {
          uniqueValue: 'trashed-unique-value',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toMatchObject({
        errors: [
          {
            path: 'uniqueValue',
          },
        ],
        valid: false,
      })
    })

    test('should report a configured compound unique index conflict for a partial update', async ({
      payload,
    }) => {
      await payload.create({
        collection: validationUniqueCollectionSlug,
        data: {
          compoundScope: 'scope-a',
          compoundValue: 'shared-value',
          uniqueValue: 'first-unique-value',
        },
        overrideAccess: true,
      })
      const storedDocument = await payload.create({
        collection: validationUniqueCollectionSlug,
        data: {
          compoundScope: 'scope-b',
          compoundValue: 'shared-value',
          uniqueValue: 'second-unique-value',
        },
        overrideAccess: true,
      })

      const result = await payload.validate({
        id: storedDocument.id,
        collection: validationUniqueCollectionSlug,
        data: {
          compoundScope: 'scope-a',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toMatchObject({
        errors: [
          {
            path: 'compoundScope',
          },
          {
            path: 'compoundValue',
          },
        ],
        valid: false,
      })
    })

    test('should report a compound unique index conflict with a trashed document', async ({
      payload,
    }) => {
      const storedDocument = await payload.create({
        collection: validationUniqueCollectionSlug,
        data: {
          compoundScope: 'trashed-scope',
          compoundValue: 'trashed-compound-value',
          uniqueValue: 'trashed-compound-owner',
        },
        overrideAccess: true,
      })

      await payload.update({
        id: storedDocument.id,
        collection: validationUniqueCollectionSlug,
        data: {
          deletedAt: new Date().toISOString(),
        } as never,
        overrideAccess: true,
      })

      const result = await payload.validate({
        collection: validationUniqueCollectionSlug,
        data: {
          compoundScope: 'trashed-scope',
          compoundValue: 'trashed-compound-value',
          uniqueValue: 'new-unique-value',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toMatchObject({
        errors: [
          {
            path: 'compoundScope',
          },
          {
            path: 'compoundValue',
          },
        ],
        valid: false,
      })
    })

    test('should exclude the stored document from configured uniqueness checks', async ({
      payload,
    }) => {
      const storedDocument = await payload.create({
        collection: validationUniqueCollectionSlug,
        data: {
          compoundScope: 'stored-scope',
          compoundValue: 'stored-compound-value',
          uniqueValue: 'stored-unique-value',
        },
        overrideAccess: true,
      })

      const result = await payload.validate({
        id: storedDocument.id,
        collection: validationUniqueCollectionSlug,
        data: {},
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    test('should use collection update access as the validate fallback', async ({ payload }) => {
      await expect(
        payload.validate({
          collection: validationFallbackCollectionSlug,
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      await expect(
        payload.validate({
          collection: validationFallbackCollectionSlug,
          context: {
            allowUpdateFallback: true,
          },
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).resolves.toEqual({
        errors: [],
        valid: true,
      })

      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'collection',
      })
      expect(fallbackAccessEvents.every(({ operation }) => operation === 'validate')).toBe(true)
    })

    test('should prefer explicit collection validate access over its update access fallback', async ({
      payload,
    }) => {
      await expect(
        payload.validate({
          collection: validationDeniedCollectionSlug,
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
    })

    test('should let an explicit null user override an authenticated reused collection request', async ({
      payload,
    }) => {
      const req = {
        user: {
          id: 'authenticated-user',
          collection: validationCollectionSlug,
        } as never,
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validate({
          collection: validationFallbackCollectionSlug,
          context: {
            requireValidationUser: true,
          },
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
          req,
          user: null,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
      expect(req.user).toMatchObject({
        id: 'authenticated-user',
      })
    })

    test('should fall back to field update access with the validate operation', async ({
      payload,
    }) => {
      const excludedResult = await payload.validate({
        collection: validationFallbackCollectionSlug,
        context: {
          allowUpdateFallback: true,
        },
        data: {
          title: 'Candidate title',
          updateProtected: 'invalid',
        },
        locale: 'en',
        overrideAccess: false,
      })

      expect(excludedResult).toEqual({
        errors: [],
        valid: true,
      })

      clearValidationEvents()

      const includedResult = await payload.validate({
        collection: validationFallbackCollectionSlug,
        context: {
          allowFieldUpdateFallback: true,
          allowUpdateFallback: true,
        },
        data: {
          title: 'Candidate title',
          updateProtected: 'invalid',
        },
        locale: 'en',
        overrideAccess: false,
      })

      expect(includedResult).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'updateProtected',
          },
        ],
        valid: false,
      })
      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'field',
      })
    })

    test('should prefer explicit field validate access over its update access fallback', async ({
      payload,
    }) => {
      const result = await payload.validate({
        collection: validationFallbackCollectionSlug,
        context: {
          allowUpdateFallback: true,
        },
        data: {
          explicitlyValidated: 'invalid',
          title: 'Candidate title',
        },
        locale: 'en',
        overrideAccess: false,
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'explicitlyValidated',
          },
        ],
        valid: false,
      })
    })

    test('should apply update access fallback constraints to stored collection validation', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: validationWhereCollectionSlug,
        data: {
          scope: 'allowed',
          title: 'Stored title',
        },
        overrideAccess: true,
      })

      await expect(
        payload.validate({
          id: stored.id,
          collection: validationWhereCollectionSlug,
          context: {
            validationScope: 'allowed',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).resolves.toEqual({
        errors: [],
        valid: true,
      })

      await expect(
        payload.validate({
          id: stored.id,
          collection: validationWhereCollectionSlug,
          context: {
            validationScope: 'denied',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
      expect(fallbackAccessEvents.every(({ operation }) => operation === 'validate')).toBe(true)
    })

    test('should reject a Where policy for collection create-candidate validation', async ({
      payload,
    }) => {
      await expect(
        payload.validate({
          collection: validationWhereCollectionSlug,
          context: {
            validationScope: 'allowed',
          },
          data: {
            scope: 'allowed',
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      expect(hookEvents).toEqual([])
    })

    test('should apply validation access to the latest collection draft before the main document', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: validationWhereCollectionSlug,
        data: {
          scope: 'main-denied',
          title: 'Published title',
        },
        overrideAccess: true,
      })

      await payload.update({
        id: stored.id,
        collection: validationWhereCollectionSlug,
        data: {
          scope: 'draft-allowed',
          title: 'Draft title',
        },
        draft: true,
        overrideAccess: true,
      })

      await expect(
        payload.validate({
          id: stored.id,
          collection: validationWhereCollectionSlug,
          context: {
            validationScope: 'draft-allowed',
          },
          draft: true,
          locale: 'en',
          overrideAccess: false,
        }),
      ).resolves.toEqual({
        errors: [],
        valid: true,
      })
    })

    test('should not fall back to an allowed main document when the latest draft is denied', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: validationWhereCollectionSlug,
        data: {
          scope: 'main-allowed',
          title: 'Published title',
        },
        overrideAccess: true,
      })

      await payload.update({
        id: stored.id,
        collection: validationWhereCollectionSlug,
        data: {
          scope: 'draft-denied',
          title: 'Draft title',
        },
        draft: true,
        overrideAccess: true,
      })

      await expect(
        payload.validate({
          id: stored.id,
          collection: validationWhereCollectionSlug,
          context: {
            validationScope: 'main-allowed',
          },
          draft: true,
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
    })

    test('should expose operation-sensitive validation permissions without changing the caller request', async ({
      payload,
    }) => {
      const req = await createPayloadRequest({
        context: {
          allowValidation: true,
        },
        payload,
      })
      req.operation = 'update'

      const authResult = await payload.auth({
        headers: new Headers(),
        req,
      })

      expect(authResult.permissions.collections?.[validationCollectionSlug]).toMatchObject({
        create: true,
        delete: true,
        fields: true,
        read: true,
        update: true,
        validate: true,
      })
      expect(authResult.permissions.globals?.[validationGlobalSlug]).toMatchObject({
        fields: true,
        read: true,
        update: true,
        validate: true,
      })
      expect(permissionOperationEvents).not.toHaveLength(0)
      expect(permissionOperationEvents).toSatisfy((events: typeof permissionOperationEvents) =>
        events.every(({ observedOperation, operation }) => observedOperation === operation),
      )
      expect(req.operation).toBe('update')
    })

    test('should validate explicit locales and tag only the invalid locale', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          summary: 'stored summary',
          title: 'English title',
        },
        locale: 'en',
        overrideAccess: true,
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

    test('should not honor fallbackLocale when the checked locale has no value of its own', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          summary: 'stored summary',
          title: 'English title',
        },
        locale: 'en',
        overrideAccess: true,
      })

      const result = await payload.validate({
        id: stored.id,
        collection: validationCollectionSlug,
        locale: 'de',
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'de',
            path: 'title',
          },
        ],
        valid: false,
      })
    })

    test('should reject null localized rows when validating a secondary collection locale', async ({
      payload,
    }) => {
      for (const fieldName of ['localizedArray', 'localizedBlocks'] as const) {
        const result = await payload.validate({
          collection: publishCollectionSlug,
          data: {
            ...getPublishCollectionLocaleData({ title: 'Spanish candidate' }),
            [fieldName]: null,
          } as never,
          locale: 'es',
          overrideAccess: true,
        })

        expect(result).toMatchObject({
          errors: [
            {
              locale: 'es',
              path: fieldName,
            },
          ],
          valid: false,
        })
      }
    })

    test('should accept null localized arrays and blocks when saving a secondary collection locale', async ({
      payload,
    }) => {
      await expect(
        payload.create({
          collection: publishCollectionSlug,
          data: {
            ...getPublishCollectionLocaleData({ title: 'Spanish candidate' }),
            localizedArray: null,
            localizedBlocks: null,
          } as never,
          locale: 'es',
          overrideAccess: true,
        }),
      ).resolves.toBeDefined()
    })

    test('should resolve all to every available locale through locale filtering', async ({
      payload,
    }) => {
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
      expect(localeFilterOperationEvents).toEqual(['validate'])
    })

    test('should not duplicate a non-localized field error once per resolved locale', async ({
      payload,
    }) => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          availableLocaleCodes: ['en', 'de'],
        },
        data: {
          title: 'Candidate title',
        },
        locale: 'all',
      })

      expect(result.valid).toBe(false)
      expect(result.errors.filter((error) => error.path === 'summary')).toHaveLength(1)
    })

    test('should preserve the locale when a non-localized field fails for one locale', async ({
      payload,
    }) => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          failNonLocalizedFieldForLocale: 'de',
        },
        data: {
          localeSensitiveValue: 'candidate value',
          summary: 'candidate summary',
          title: 'Candidate title',
        } as never,
        locale: ['en', 'de'],
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'de',
            message: 'The shared value is invalid for this locale',
            path: 'localeSensitiveValue',
          },
        ],
        valid: false,
      })
    })

    test('should preserve locale information for a stored localized field inside an omitted array', async ({
      payload,
    }) => {
      const draft = await payload.create({
        collection: publishCollectionSlug,
        data: {
          ...getPublishCollectionLocaleData({ title: 'English draft' }),
          nestedLocalizedArray: [{ value: '' }],
        } as never,
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })
      const nestedRowID = (draft as unknown as { nestedLocalizedArray: { id: string }[] })
        .nestedLocalizedArray[0]!.id

      await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          ...getPublishCollectionLocaleData({ title: 'Spanish draft' }),
          nestedLocalizedArray: [{ id: nestedRowID, value: 'Spanish value' }],
        } as never,
        draft: true,
        locale: 'es',
        overrideAccess: true,
      })

      const result = await payload.validate({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: true,
        locale: ['en', 'es'],
        overrideAccess: true,
      })

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          locale: 'en',
          path: 'nestedLocalizedArray.0.value',
        }),
      )
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({
          locale: 'es',
          path: 'nestedLocalizedArray.0.value',
        }),
      )
    })

    test('should preserve locale information when an omitted array hook returns a nested localized error', async ({
      payload,
    }) => {
      const draft = await payload.create({
        collection: publishCollectionSlug,
        data: {
          ...getPublishCollectionLocaleData({ title: 'English draft' }),
          nestedLocalizedArray: [{ value: 'English value' }],
        } as never,
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })
      const nestedRowID = (draft as unknown as { nestedLocalizedArray: { id: string }[] })
        .nestedLocalizedArray[0]!.id

      await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          ...getPublishCollectionLocaleData({ title: 'Spanish draft' }),
          nestedLocalizedArray: [{ id: nestedRowID, value: 'Spanish value' }],
        } as never,
        draft: true,
        locale: 'es',
        overrideAccess: true,
      })

      const result = await payload.validate({
        id: draft.id,
        collection: publishCollectionSlug,
        context: {
          throwStoredNestedLocalizedArrayValidationError: true,
        },
        draft: true,
        locale: ['en', 'es'],
        overrideAccess: true,
      })

      expect(result.errors).toEqual([
        expect.objectContaining({
          locale: 'en',
          message: 'Stored nested localized field validation failure',
          path: 'nestedLocalizedArray.0.value',
        }),
        expect.objectContaining({
          locale: 'es',
          message: 'Stored nested localized field validation failure',
          path: 'nestedLocalizedArray.0.value',
        }),
      ])
    })

    test('should preserve different messages for one non-localized path', async ({ payload }) => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          availableLocaleCodes: ['en', 'de'],
          throwMultipleValidationErrors: true,
        },
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'all',
      })

      expect(result).toEqual({
        errors: [
          {
            locale: undefined,
            message: 'Summary failed the first check',
            path: 'summary',
          },
          {
            locale: undefined,
            message: 'Summary failed the second check',
            path: 'summary',
          },
        ],
        valid: false,
      })
    })

    test('should deduplicate explicit locales in deterministic order', async ({ payload }) => {
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

    test('should use the default locale when locale is omitted', async ({ payload }) => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        data: {
          summary: 'candidate summary',
          title: '',
        },
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
    })

    test('should reject empty, unknown, and unavailable locale selectors', async ({ payload }) => {
      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: [],
        } as never),
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

      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          context: {
            availableLocaleCodes: [],
          },
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: 'all',
        }),
      ).rejects.toThrow('No validation locales are available')
    })

    test('should cap concurrent locale passes at three with isolated request state', async ({
      payload,
    }) => {
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

    test('should isolate mutable access data and request state between collection locale passes', async ({
      payload,
    }) => {
      const candidateData = {
        isolation: { marker: 'caller' },
        summary: 'candidate summary',
        title: 'Candidate title',
      }
      const context = {
        allowValidation: true,
        isolation: { marker: 'caller' },
        trackMutableIsolation: true,
      }
      const requestData = { isolation: { marker: 'caller' } }
      const query = { isolation: { marker: 'caller' } }
      const routeParams = { isolation: { marker: 'caller' } }
      const user = {
        id: 'validation-user',
        collection: validationCollectionSlug,
        isolation: { marker: 'caller' },
      }
      const transactionID = Promise.resolve('validation-transaction')
      const req = {
        data: requestData,
        headers: new Headers({ 'x-validation-isolation': 'caller' }),
        query,
        responseHeaders: new Headers({ 'x-validation-isolation': 'caller' }),
        routeParams,
        transactionID,
      } satisfies Partial<PayloadRequest>

      const result = await payload.validate({
        collection: validationCollectionSlug,
        context,
        data: candidateData,
        locale: ['en', 'es'],
        overrideAccess: false,
        req,
        user: user as never,
      })

      expect(result.valid).toBe(true)
      expect(isolationEvents).toEqual([
        {
          candidateMarker: 'caller',
          contextMarker: 'caller',
          headerMarker: 'caller',
          locale: 'en',
          queryMarker: 'caller',
          requestDataMarker: 'caller',
          responseHeaderMarker: 'caller',
          routeMarker: 'caller',
          source: 'collection',
          userMarker: 'caller',
        },
        {
          candidateMarker: 'caller',
          contextMarker: 'caller',
          headerMarker: 'caller',
          locale: 'es',
          queryMarker: 'caller',
          requestDataMarker: 'caller',
          responseHeaderMarker: 'caller',
          routeMarker: 'caller',
          source: 'collection',
          userMarker: 'caller',
        },
      ])
      expect(candidateData.isolation.marker).toBe('caller')
      expect(context.isolation.marker).toBe('caller')
      expect(requestData.isolation.marker).toBe('caller')
      expect(query.isolation.marker).toBe('caller')
      expect(req.headers.get('x-validation-isolation')).toBe('caller')
      expect(req.responseHeaders.get('x-validation-isolation')).toBe('caller')
      expect(routeParams.isolation.marker).toBe('caller')
      expect(user.isolation.marker).toBe('caller')
      expect(
        validationRuntimeIdentityEvents.every(
          (event) => event.payload === payload && event.transactionID === transactionID,
        ),
      ).toBe(true)
      expect(req.transactionID).toBe(transactionID)
    })

    test('should return field errors for invalid create data without creating a document', async ({
      payload,
    }) => {
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
      expect(
        await payload.count({ collection: validationCollectionSlug, overrideAccess: true }),
      ).toEqual({
        totalDocs: 0,
      })
      expect(req.operation).toBe('update')
    })

    test('should require a username or email for auth collection create validation', async ({
      payload,
    }) => {
      const authFields = payload.collections[validationAuthCollectionSlug]!.config.fields

      expect(
        authFields
          .filter((field) => 'name' in field && ['email', 'username'].includes(field.name))
          .map((field) => ({
            name: 'name' in field ? field.name : '',
            required: 'required' in field ? field.required : undefined,
          })),
      ).toEqual([
        { name: 'email', required: false },
        { name: 'username', required: false },
      ])

      const result = await payload.validate({
        collection: validationAuthCollectionSlug,
        data: {
          password: 'validation-password',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toEqual({
        errors: expect.arrayContaining([
          expect.objectContaining({ message: 'Username or email is required', path: 'username' }),
          expect.objectContaining({ message: 'Username or email is required', path: 'email' }),
        ]),
        valid: false,
      })
    })

    test('should prevent clearing both username and email during auth collection validation', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: validationAuthCollectionSlug,
        data: {
          password: 'validation-password',
          username: 'stored-user',
        },
        overrideAccess: true,
      })

      const result = await payload.validate({
        id: stored.id,
        collection: validationAuthCollectionSlug,
        data: {
          email: '',
          username: '',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toEqual({
        errors: expect.arrayContaining([
          expect.objectContaining({ message: 'Username or email is required', path: 'username' }),
          expect.objectContaining({ message: 'Username or email is required', path: 'email' }),
        ]),
        valid: false,
      })
    })

    test('should run validation hooks in order with the validate operation and unchanged context', async ({
      payload,
    }) => {
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
        overrideAccess: true,
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

    test('should pass the validate operation into nested Lexical field hooks', async ({
      payload,
    }) => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        data: {
          blockRichText: buildNestedFieldValidateBlockRichText('nested block value'),
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result.valid).toBe(true)

      const nestedBlockFieldValidateEvent = hookEvents.find(
        ({ hook }) => hook === 'nestedBlockFieldValidate',
      )
      expect(nestedBlockFieldValidateEvent).toBeDefined()
      expect(nestedBlockFieldValidateEvent?.operation).toBe('validate')
      expect(nestedBlockFieldValidateEvent?.requestOperation).toBe('validate')

      const nestedBlockFieldBeforeChangeEvent = hookEvents.find(
        ({ hook }) => hook === 'nestedBlockFieldBeforeChange',
      )
      expect(nestedBlockFieldBeforeChangeEvent).toBeDefined()
      expect(nestedBlockFieldBeforeChangeEvent?.operation).toBe('validate')
      expect(nestedBlockFieldBeforeChangeEvent?.requestOperation).toBe('validate')
    })

    test('should apply defaults before validating required fields', async ({ payload }) => {
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

    test('should apply required createdBy authorship during create validation', async ({
      payload,
    }) => {
      const userDocument = await payload.create({
        collection: 'users',
        data: {
          email: 'validation-authorship@example.com',
          password: devUser.password,
        },
        overrideAccess: true,
      })
      const user = { ...userDocument, collection: 'users' as const }

      const result = await payload.validate({
        collection: validationNonLocalizedCollectionSlug,
        data: {
          title: 'Candidate title',
        },
        overrideAccess: false,
        user,
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    test('should reject missing required runtime arguments', async ({ payload }) => {
      const invalidArguments = [
        {
          args: {
            collection: validationCollectionSlug,
            locale: 'en',
          },
          errorMessage: 'Validation create simulation requires data',
        },
      ]

      for (const { args, errorMessage } of invalidArguments) {
        await expect(payload.validate(args as never)).rejects.toThrow(errorMessage)
      }
    })

    test('should merge partial update data over the stored locale without persisting it', async ({
      payload,
    }) => {
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
        overrideAccess: true,
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

    test('should reject an explicit null point instead of restoring the stored collection value', async ({
      payload,
    }) => {
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
          location: null,
        },
        locale: 'en',
      })
      const afterValidation = await payload.findByID({
        id: stored.id,
        collection: validationCollectionSlug,
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'location',
          },
        ],
        valid: false,
      })
      expect(afterValidation.location).toEqual([-0.12, 51.5])
    })

    test('should reject a malformed point instead of restoring the stored collection value', async ({
      payload,
    }) => {
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
          location: { coordinates: [-0.12] },
        } as never,
        locale: 'en',
      })

      expect(result).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'location',
          },
        ],
        valid: false,
      })
    })

    test('should use after-read values from a stored collection document', async ({ payload }) => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          afterReadValue: 'stored',
          summary: 'stored summary',
          title: 'Stored title',
        },
        locale: 'en',
        overrideAccess: true,
      })

      const result = await payload.validate({
        id: stored.id,
        collection: validationCollectionSlug,
        context: {
          requireAfterReadPreviousValue: true,
        },
        data: {
          summary: 'candidate summary',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    test('should classify errors using data returned from collection hooks', async ({
      payload,
    }) => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          replaceSharedBlockWithLocalizedBlock: true,
        },
        data: {
          hookReplacedBlocks: [
            {
              blockType: 'sharedValidationBlock',
              value: 'shared value',
            },
          ],
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: ['en', 'es'],
        overrideAccess: true,
      })

      expect(result.errors).toEqual([
        expect.objectContaining({
          locale: 'en',
          path: 'hookReplacedBlocks.0.value',
        }),
        expect.objectContaining({
          locale: 'es',
          path: 'hookReplacedBlocks.0.value',
        }),
      ])
    })

    test('should use the published collection as the validation base unless draft is true', async ({
      payload,
    }) => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish valid',
        payload,
      })

      await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          _status: 'published',
          title: 'English published',
        },
        locale: 'en',
        overrideAccess: true,
      })
      await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          title: '',
        },
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })

      const versionsBefore = await payload.countVersions({
        collection: publishCollectionSlug,
        overrideAccess: true,
        where: {
          parent: {
            equals: draft.id,
          },
        },
      })
      const defaultResult = await payload.validate({
        id: draft.id,
        collection: publishCollectionSlug,
        locale: 'en',
      })
      const publishedResult = await payload.validate({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: false,
        locale: 'en',
      })
      const draftResult = await payload.validate({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: true,
        locale: 'en',
      })
      const publishedAfter = await payload.findByID({
        id: draft.id,
        collection: publishCollectionSlug,
        locale: 'en',
        overrideAccess: true,
      })
      const draftAfter = await payload.findByID({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })
      const versionsAfter = await payload.countVersions({
        collection: publishCollectionSlug,
        overrideAccess: true,
        where: {
          parent: {
            equals: draft.id,
          },
        },
      })

      expect(defaultResult).toEqual({
        errors: [],
        valid: true,
      })
      expect(publishedResult).toEqual({
        errors: [],
        valid: true,
      })
      expect(draftResult).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'title',
          },
        ],
        valid: false,
      })
      expect(publishedAfter.title).toBe('English published')
      expect(draftAfter.title).toBe('')
      expect(versionsAfter).toEqual(versionsBefore)
    })

    test('should validate a partial update with an unchanged stored point representation', async ({
      payload,
    }) => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          location: [-73.9857, 40.7484],
          summary: 'stored summary',
          title: 'Stored title',
        },
        locale: 'en',
        overrideAccess: true,
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

    test('should execute first-class collection validation access and throw on denial', async ({
      payload,
    }) => {
      const req = {
        operation: 'delete',
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          context: {
            denyValidationAccess: true,
          },
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

    test('should restore the caller request operation after a collection hook throws', async ({
      payload,
    }) => {
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

    test('should return a validation result instead of throwing when a collection hook throws a ValidationError', async ({
      payload,
    }) => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        context: {
          throwValidationErrorHook: true,
        },
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'en',
      })

      expect(result).toEqual({
        errors: [
          expect.objectContaining({
            message: 'Collection hook validation failure',
            path: 'title',
          }),
        ],
        valid: false,
      })
    })

    test('should return a validation result when a collection field beforeValidate hook throws a ValidationError', async ({
      payload,
    }) => {
      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          context: {
            throwFieldValidationError: true,
          },
          data: {
            summary: 'candidate summary',
            title: 'Candidate title',
          },
          locale: 'en',
        }),
      ).resolves.toEqual({
        errors: [
          expect.objectContaining({
            message: 'Collection field validation failure',
            path: 'title',
          }),
        ],
        valid: false,
      })
    })
  })

  test.describe('globals', () => {
    test('should use global update access as the validate fallback', async ({ payload }) => {
      await expect(
        payload.validateGlobal({
          slug: validationFallbackGlobalSlug,
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      await expect(
        payload.validateGlobal({
          slug: validationFallbackGlobalSlug,
          context: {
            allowUpdateFallback: true,
          },
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).resolves.toEqual({
        errors: [],
        valid: true,
      })

      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'global',
      })
      expect(fallbackAccessEvents.every(({ operation }) => operation === 'validate')).toBe(true)
    })

    test('should prefer explicit global validate access over its update access fallback', async ({
      payload,
    }) => {
      await expect(
        payload.validateGlobal({
          slug: validationDeniedGlobalSlug,
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
    })

    test('should load a draft-only global only when draft validation is requested', async ({
      payload,
    }) => {
      const versionsBefore = await payload.countGlobalVersions({
        global: validationDraftSourceGlobalSlug,
        overrideAccess: true,
      })

      const draftResult = await payload.validateGlobal({
        slug: validationDraftSourceGlobalSlug,
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })
      const defaultResult = await payload.validateGlobal({
        slug: validationDraftSourceGlobalSlug,
        locale: 'en',
        overrideAccess: true,
      })
      const mainResult = await payload.validateGlobal({
        slug: validationDraftSourceGlobalSlug,
        draft: false,
        locale: 'en',
        overrideAccess: true,
      })
      const versionsAfter = await payload.countGlobalVersions({
        global: validationDraftSourceGlobalSlug,
        overrideAccess: true,
      })

      expect(draftResult).toEqual({
        errors: [],
        valid: true,
      })
      expect(defaultResult).toMatchObject({
        errors: expect.arrayContaining([
          expect.objectContaining({
            locale: 'en',
            path: 'title',
          }),
        ]),
        valid: false,
      })
      expect(mainResult).toEqual(defaultResult)
      expect(versionsAfter).toEqual(versionsBefore)
    })

    test('should resolve an access-constrained draft when no matching main global exists', async ({
      payload,
    }) => {
      const req = {
        operation: 'read',
      } satisfies Partial<PayloadRequest>

      const result = await payload.validateGlobal({
        slug: validationDraftSourceGlobalSlug,
        context: {
          validationScope: 'draft-visible',
        },
        draft: true,
        locale: 'en',
        overrideAccess: false,
        req,
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
      expect(globalValidationSourceEvents).toEqual([validationDraftSourceGlobalSlug])
      expect(req.operation).toBe('read')
    })

    test('should not fall back to an allowed main global when the latest draft is denied', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: validationDraftSourceGlobalSlug,
        data: {
          _status: 'published',
          scope: 'main-allowed',
          title: 'Published title',
        },
        locale: 'en',
        overrideAccess: true,
      })
      await payload.updateGlobal({
        slug: validationDraftSourceGlobalSlug,
        data: {
          scope: 'draft-denied',
          title: 'Draft title',
        },
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })

      await expect(
        payload.validateGlobal({
          slug: validationDraftSourceGlobalSlug,
          context: {
            validationScope: 'main-allowed',
          },
          draft: true,
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
    })

    test('should reject the newest global draft when only an older draft satisfies access', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: validationDraftSourceGlobalSlug,
        data: {
          _status: 'draft',
          scope: 'draft-hidden',
          title: 'Newer hidden draft',
        },
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })
      clearValidationEvents()

      await expect(
        payload.validateGlobal({
          slug: validationDraftSourceGlobalSlug,
          context: {
            validationScope: 'draft-visible',
          },
          draft: true,
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      expect(globalValidationSourceEvents).toEqual([])
    })

    test('should reject a Where policy that filters out the persisted main global', async ({
      payload,
    }) => {
      await expect(
        payload.validateGlobal({
          slug: validationAccessSourceGlobalSlug,
          context: {
            validationScope: 'candidate-public',
          },
          data: {
            scope: 'candidate-public',
            title: 'Valid candidate title',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        status: 403,
      })

      expect(globalValidationSourceEvents).toEqual([])
    })

    test('should validate valid partial global data without persisting it', async ({ payload }) => {
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
        overrideAccess: true,
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
      expect(localeFilterOperationEvents).toEqual(['validate'])
      expect(req.operation).toBe('read')
    })

    test('should use the default locale for global validation when locale is omitted', async ({
      payload,
    }) => {
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        data: {
          title: '',
        },
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
    })

    test('should return errors for invalid partial global data without persisting it', async ({
      payload,
    }) => {
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
        overrideAccess: true,
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

    test('should use after-read values from a stored global document', async ({ payload }) => {
      await payload.updateGlobal({
        slug: validationGlobalSlug,
        data: {
          afterReadValue: 'stored',
          summary: 'stored global summary',
          title: 'Stored global title',
        },
        locale: 'en',
        overrideAccess: true,
      })

      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        context: {
          requireAfterReadPreviousValue: true,
        },
        data: {
          summary: 'candidate global summary',
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    test('should use the published global as the validation base unless draft is true', async ({
      payload,
    }) => {
      await seedPublishGlobal({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish valid',
        payload,
      })
      await payload.updateGlobal({
        slug: publishGlobalSlug,
        data: {
          _status: 'published',
          title: 'English published',
        },
        locale: 'en',
        overrideAccess: true,
      })
      await payload.updateGlobal({
        slug: publishGlobalSlug,
        data: {
          title: '',
        },
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })

      const versionsBefore = await payload.countGlobalVersions({
        global: publishGlobalSlug,
        overrideAccess: true,
      })
      const defaultResult = await payload.validateGlobal({
        slug: publishGlobalSlug,
        locale: 'en',
      })
      const publishedResult = await payload.validateGlobal({
        slug: publishGlobalSlug,
        draft: false,
        locale: 'en',
      })
      const draftResult = await payload.validateGlobal({
        slug: publishGlobalSlug,
        draft: true,
        locale: 'en',
      })
      const publishedAfter = await payload.findGlobal({
        slug: publishGlobalSlug,
        locale: 'en',
        overrideAccess: true,
      })
      const draftAfter = await payload.findGlobal({
        slug: publishGlobalSlug,
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })
      const versionsAfter = await payload.countGlobalVersions({
        global: publishGlobalSlug,
        overrideAccess: true,
      })

      expect(defaultResult).toEqual({
        errors: [],
        valid: true,
      })
      expect(publishedResult).toEqual({
        errors: [],
        valid: true,
      })
      expect(draftResult).toMatchObject({
        errors: [
          {
            locale: 'en',
            path: 'title',
          },
        ],
        valid: false,
      })
      expect(publishedAfter.title).toBe('English published')
      expect(draftAfter.title).toBe('')
      expect(versionsAfter).toEqual(versionsBefore)
    })

    test('should execute first-class global validation access and throw on denial', async ({
      payload,
    }) => {
      const req = {
        operation: 'delete',
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validateGlobal({
          slug: validationGlobalSlug,
          context: {
            denyValidationAccess: true,
          },
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
  })

  test.describe('REST API', () => {
    test('should not backfill API key metadata during REST validation', async ({
      payload,
      restClient,
    }) => {
      const apiKey = randomUUID()
      const apiKeyUser = await payload.create({
        collection: validationAuthCollectionSlug,
        data: {
          apiKey,
          password: devUser.password,
          username: 'rest-validation-api-key-user',
        } as never,
        overrideAccess: true,
      })

      await payload.db.updateOne({
        id: apiKeyUser.id,
        collection: validationAuthCollectionSlug,
        data: { apiKeyLast4: null },
        req: {} as never,
      })

      const response = await restClient.POST(`/${validationCollectionSlug}/validate?locale=en`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
        headers: {
          Authorization: `${validationAuthCollectionSlug} API-Key ${apiKey}`,
        },
      })
      const storedUser = await payload.db.findOne({
        collection: validationAuthCollectionSlug,
        req: {} as never,
        where: { id: { equals: apiKeyUser.id } },
      })

      expect(response.status).toBe(200)
      expect(storedUser?.apiKeyLast4).toBeNull()
    })

    test('should not backfill API key metadata during REST validation with a trailing slash', async ({
      payload,
      restClient,
    }) => {
      const apiKey = randomUUID()
      const apiKeyUser = await payload.create({
        collection: validationAuthCollectionSlug,
        data: {
          apiKey,
          password: devUser.password,
          username: 'rest-trailing-slash-validation-api-key-user',
        } as never,
        overrideAccess: true,
      })

      await payload.db.updateOne({
        id: apiKeyUser.id,
        collection: validationAuthCollectionSlug,
        data: { apiKeyLast4: null },
        req: {} as never,
      })

      const response = await restClient.POST(`/${validationCollectionSlug}/validate/?locale=en`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
        headers: {
          Authorization: `${validationAuthCollectionSlug} API-Key ${apiKey}`,
        },
      })
      const storedUser = await payload.db.findOne({
        collection: validationAuthCollectionSlug,
        req: {} as never,
        where: { id: { equals: apiKeyUser.id } },
      })

      expect(response.status).toBe(200)
      expect(storedUser?.apiKeyLast4).toBeNull()
    })

    test('should remove multipart temp files when REST validation access is denied', async ({
      payload,
      restClient,
    }) => {
      const storedDocument = await payload.create({
        collection: validationDeniedCollectionSlug,
        data: { title: 'Stored title' },
        overrideAccess: true,
      })
      const endpoints: `/${string}`[] = [
        `/globals/${validationDeniedGlobalSlug}/validate?locale=en`,
        `/${validationDeniedCollectionSlug}/validate?locale=en`,
        `/${validationDeniedCollectionSlug}/${storedDocument.id}/validate?locale=en`,
      ]

      for (const endpoint of endpoints) {
        const formData = new FormData()
        formData.append('_payload', JSON.stringify({ title: 'Candidate title' }))
        formData.append('file', new Blob(['must be removed']), 'temporary.txt')
        formData.append('secondary', new Blob(['must also be removed']), 'secondary.txt')

        const response = await restClient.POST(endpoint, { body: formData })

        expect(response.status).toBe(403)
        await expect(fs.readdir(validationTempFilesDir)).resolves.toEqual([])
      }
    })

    test('should remove multipart temp files when the validation locale is invalid', async ({
      payload,
      restClient,
    }) => {
      const storedDocument = await payload.create({
        collection: validationDeniedCollectionSlug,
        data: { title: 'Stored title' },
        overrideAccess: true,
      })
      const endpoints: `/${string}`[] = [
        `/globals/${validationDeniedGlobalSlug}/validate?locale=`,
        `/${validationDeniedCollectionSlug}/validate?locale=`,
        `/${validationDeniedCollectionSlug}/${storedDocument.id}/validate?locale=`,
      ]

      for (const endpoint of endpoints) {
        const formData = new FormData()
        formData.append('_payload', JSON.stringify({ title: 'Candidate title' }))
        formData.append('file', new Blob(['must be removed']), 'temporary.txt')

        const response = await restClient.POST(endpoint, { body: formData })

        expect(response.status).toBe(400)
        await expect(fs.readdir(validationTempFilesDir)).resolves.toEqual([])
      }
    })

    test('should remove multipart temp files when validation data is malformed', async ({
      payload,
      restClient,
    }) => {
      const storedDocument = await payload.create({
        collection: validationDeniedCollectionSlug,
        data: { title: 'Stored title' },
        overrideAccess: true,
      })
      const endpoints: `/${string}`[] = [
        `/globals/${validationDeniedGlobalSlug}/validate?locale=en`,
        `/${validationDeniedCollectionSlug}/validate?locale=en`,
        `/${validationDeniedCollectionSlug}/${storedDocument.id}/validate?locale=en`,
      ]

      for (const endpoint of endpoints) {
        const formData = new FormData()
        formData.append('_payload', JSON.stringify([]))
        formData.append('file', new Blob(['must be removed']), 'temporary.txt')

        const response = await restClient.POST(endpoint, { body: formData })

        expect(response.status).toBe(400)
        await expect(fs.readdir(validationTempFilesDir)).resolves.toEqual([])
      }
    })

    test('should deny REST validation when explicit validate access denies it', async ({
      restClient,
    }) => {
      const endpoints: `/${string}`[] = [
        `/globals/${validationDeniedGlobalSlug}/validate?locale=en`,
        `/${validationDeniedCollectionSlug}/validate?locale=en`,
      ]

      for (const endpoint of endpoints) {
        const response = await restClient.POST(endpoint, {
          body: JSON.stringify({
            title: 'Candidate title',
          }),
        })

        expect(response.status).toBe(403)
      }
    })

    test('should return 404 for a nonexistent collection document', async ({
      payload,
      restClient,
    }) => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          summary: 'stored summary',
          title: 'English title',
        },
        locale: 'en',
      })
      const nonexistentID = typeof stored.id === 'number' ? stored.id + 1000 : randomUUID()

      const response = await restClient.POST(
        `/${validationCollectionSlug}/${nonexistentID}/validate?locale=en`,
      )

      expect(response.status).toBe(404)
    })

    test('should return invalid collection create validation without creating a document', async ({
      payload,
      restClient,
    }) => {
      const response = await restClient.POST(`/${validationCollectionSlug}/validate`, {
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
      expect(
        await payload.count({ collection: validationCollectionSlug, overrideAccess: true }),
      ).toEqual({
        totalDocs: 0,
      })
    })

    test('should return 400 for invalid REST input', async ({ restClient }) => {
      const invalidInputs: Array<{
        body: unknown
        endpoint: `/${string}`
        expectedMessage: string
      }> = [
        {
          body: { summary: 'candidate summary', title: 'Candidate title' },
          endpoint: `/${validationCollectionSlug}/validate?locale=`,
          expectedMessage: 'Validation requires a locale.',
        },
        {
          body: [],
          endpoint: `/${validationCollectionSlug}/validate?locale=en`,
          expectedMessage: 'Validation data must be an object.',
        },
      ]

      for (const { body, endpoint, expectedMessage } of invalidInputs) {
        const response = await restClient.POST(endpoint, {
          body: JSON.stringify(body),
        })
        const result = await response.json()

        expect(response.status).toBe(400)
        expect(result.errors).toEqual([expect.objectContaining({ message: expectedMessage })])
      }
    })

    test('should accept repeated and all locale selectors', async ({ restClient }) => {
      const repeatedLocale = await restClient.POST(
        `/${validationCollectionSlug}/validate?locale=en&locale=es`,
        {
          body: JSON.stringify({
            summary: 'candidate summary',
            title: 'Candidate title',
          }),
        },
      )
      expect(repeatedLocale.status).toBe(200)
      await expect(repeatedLocale.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })

      clearValidationEvents()

      const allLocales = await restClient.POST(`/${validationCollectionSlug}/validate?locale=all`, {
        body: JSON.stringify({
          summary: 'candidate summary',
          title: 'Candidate title',
        }),
      })

      expect(allLocales.status).toBe(200)
      await expect(allLocales.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
      expect(localeFilterOperationEvents).toEqual(['validate'])
    })

    test('should merge by-ID validation data without persisting it', async ({
      payload,
      restClient,
    }) => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
          location: [-0.12, 51.5],
          summary: 'stored summary',
          title: 'Stored title',
        },
        locale: 'en',
        overrideAccess: true,
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
        overrideAccess: true,
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

    test('should validate global data without persisting it', async ({ payload, restClient }) => {
      const response = await restClient.POST(`/globals/${validationGlobalSlug}/validate`, {
        body: JSON.stringify({
          title: '',
        }),
      })
      const afterValidation = await payload.findGlobal({
        slug: validationGlobalSlug,
        locale: 'en',
        overrideAccess: true,
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

    test('should keep body control-shaped fields as data without changing trusted access inputs', async ({
      payload,
      restClient,
    }) => {
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

      try {
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
      } finally {
        collection.config.access.validate = validate
      }
    })
  })

  test.describe('GraphQL API', () => {
    test.beforeEach(async ({ payload, restClient }) => {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
        overrideAccess: true,
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: devUser.email,
          password: devUser.password,
        },
      })
    })

    test('should not backfill API key metadata during GraphQL validation', async ({
      payload,
      restClient,
    }) => {
      const apiKey = randomUUID()
      const apiKeyUser = await payload.create({
        collection: validationAuthCollectionSlug,
        data: {
          apiKey,
          password: devUser.password,
          username: 'graphql-validation-api-key-user',
        } as never,
        overrideAccess: true,
      })

      await payload.db.updateOne({
        id: apiKeyUser.id,
        collection: validationAuthCollectionSlug,
        data: { apiKeyLast4: null },
        req: {} as never,
      })

      const query = `mutation {
        validateValidationItem(data: {
          summary: "Candidate summary"
          title: "Candidate title"
        }) {
          valid
        }
      }`
      const response = await restClient.GRAPHQL_POST({
        auth: false,
        body: JSON.stringify({ query }),
        headers: {
          Authorization: `${validationAuthCollectionSlug} API-Key ${apiKey}`,
        },
      })
      const storedUser = await payload.db.findOne({
        collection: validationAuthCollectionSlug,
        req: {} as never,
        where: { id: { equals: apiKeyUser.id } },
      })

      expect(response.status).toBe(200)
      expect(storedUser?.apiKeyLast4).toBeNull()
    })

    test('should enforce explicit global validate access before running validation hooks', async ({
      restClient,
    }) => {
      const query = `mutation {
        validateValidationDeniedSetting(data: { title: "GraphQL candidate" }) {
          valid
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(response.data.validateValidationDeniedSetting).toBeNull()
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({ statusCode: 403 }),
          }),
        ]),
      )
      expect(scheduledValidationEvents).toEqual([])
    })

    test('should return a validation result for an invalid collection create candidate without persisting it', async ({
      payload,
      restClient,
    }) => {
      const docsBefore = await payload.count({
        collection: writeTargetsSlug,
        overrideAccess: true,
      })

      const query = `mutation {
        validateValidationWriteTarget(data: {}) {
          valid
          errors {
            path
            message
          }
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(data.validateValidationWriteTarget.valid).toBe(false)
      expect(data.validateValidationWriteTarget.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: 'title' })]),
      )
      expect(await payload.count({ collection: writeTargetsSlug, overrideAccess: true })).toEqual(
        docsBefore,
      )
    })

    test('should validate a collection create candidate with a custom ID', async ({
      restClient,
    }) => {
      const query = `mutation {
        validateValidationCustomIDItem(data: { id: "candidate-custom-id" }) {
          valid
          errors {
            path
            message
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(response.errors).toBeUndefined()
      expect(response.data.validateValidationCustomIDItem).toEqual({ errors: [], valid: true })
    })

    test('should validate an empty collection create candidate without a data argument', async ({
      restClient,
    }) => {
      const query = `mutation {
        validateValidationEmptyItem {
          valid
          errors {
            path
            message
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(response.errors).toBeUndefined()
      expect(response.data.validateValidationEmptyItem).toEqual({ errors: [], valid: true })
    })

    test('should validate a stored collection document by id without persisting the candidate', async ({
      payload,
      restClient,
    }) => {
      const target = await createWriteTarget({ payload })

      const query = `mutation {
        validateValidationWriteTarget(id: ${formatGraphQLID({ id: target.id, payload })}, data: { title: "" }) {
          valid
          errors {
            path
            message
          }
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(data.validateValidationWriteTarget.valid).toBe(false)
      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({ title: 'stored target' })
    })

    test('should return a validation result for a global document', async ({ restClient }) => {
      const query = `mutation {
        validateValidationWriteTargetSetting(data: { title: "" }) {
          valid
          errors {
            path
            message
          }
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(data.validateValidationWriteTargetSetting.valid).toBe(false)
      expect(data.validateValidationWriteTargetSetting.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: 'title' })]),
      )
    })

    test('should accept partial global validation data at every nesting level', async ({
      restClient,
    }) => {
      const query = `mutation {
        validateValidationSetting(data: { metadata: {} }) {
          valid
          errors {
            path
            message
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(response.errors).toBeUndefined()
      expect(response.data.validateValidationSetting).toEqual({ errors: [], valid: true })
    })

    test('should isolate transaction IDs between GraphQL validation resolvers', async ({
      restClient,
    }) => {
      clearValidationEvents()

      const collectionQuery = `mutation {
        setCollection: validateValidationItem(data: {
          summary: "Candidate summary"
          title: "Candidate title"
          transactionMarker: "set"
        }) {
          valid
        }
        observeGlobal: validateValidationSetting(data: { transactionMarker: "observe" }) {
          valid
        }
      }`

      const collectionResponse = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: collectionQuery }) })
        .then((res) => res.json())

      expect(collectionResponse.errors).toBeUndefined()
      expect(graphqlValidationTransactionEvents).toEqual([
        { marker: 'set', source: 'collection', transactionID: undefined },
        { marker: 'observe', source: 'global', transactionID: undefined },
      ])

      clearValidationEvents()

      const globalQuery = `mutation {
        setGlobal: validateValidationSetting(data: { transactionMarker: "set" }) {
          valid
        }
        observeCollection: validateValidationItem(data: {
          summary: "Candidate summary"
          title: "Candidate title"
          transactionMarker: "observe"
        }) {
          valid
        }
      }`

      const globalResponse = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: globalQuery }) })
        .then((res) => res.json())

      expect(globalResponse.errors).toBeUndefined()
      expect(graphqlValidationTransactionEvents).toEqual([
        { marker: 'set', source: 'global', transactionID: undefined },
        { marker: 'observe', source: 'collection', transactionID: undefined },
      ])
    })
  })

  test.describe('write safety', () => {
    test('should reject a create that reuses the validation request before a row is written', async ({
      payload,
    }) => {
      await expect(runWriteAttempt({ payload, writeAttempt: 'create' })).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: writeTargetsSlug, overrideAccess: true })).toEqual({
        totalDocs: 0,
      })
    })

    test('should reject document writes that reuse the validation request', async ({ payload }) => {
      for (const writeAttempt of ['update', 'updateMany', 'delete', 'deleteMany'] as const) {
        const target = await createWriteTarget({ payload })

        await expect(
          runWriteAttempt({ payload, targetID: target.id, writeAttempt }),
        ).rejects.toThrow('Payload writes are not allowed during validation')

        await expect(
          payload.findByID({
            id: target.id,
            collection: writeTargetsSlug,
            overrideAccess: true,
          }),
        ).resolves.toMatchObject({
          title: 'stored target',
        })
      }
    })

    test('should reject a global update that reuses the validation request before data is written', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'stored global target',
        },
        overrideAccess: true,
      })

      await expect(runWriteAttempt({ payload, writeAttempt: 'updateGlobal' })).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findGlobal({
          slug: validationWriteTargetGlobalSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'stored global target',
      })
    })

    test('should reject a collection version restore before the document is written', async ({
      payload,
    }) => {
      const target = await createWriteTarget({ payload })

      await payload.update({
        id: target.id,
        collection: writeTargetsSlug,
        data: {
          title: 'latest target',
        },
        disableTransaction: true,
        overrideAccess: true,
      })

      const versions = await payload.findVersions({
        collection: writeTargetsSlug,
        overrideAccess: true,
        where: {
          parent: {
            equals: target.id,
          },
        },
      })
      const originalVersion = versions.docs.find(({ version }) => version.title === 'stored target')

      expect(originalVersion).toBeDefined()

      await expect(
        runWriteAttempt({ payload, targetID: originalVersion!.id, writeAttempt: 'restoreVersion' }),
      ).rejects.toThrow('Payload writes are not allowed during validation')

      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'latest target',
      })
    })

    test('should reject a global version restore before the global is written', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'stored global target',
        },
        overrideAccess: true,
      })
      await payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'latest global target',
        },
        overrideAccess: true,
      })

      const versions = await payload.findGlobalVersions({
        slug: validationWriteTargetGlobalSlug,
        overrideAccess: true,
      })
      const originalVersion = versions.docs.find(
        ({ version }) => version.title === 'stored global target',
      )

      expect(originalVersion).toBeDefined()

      await expect(
        runWriteAttempt({
          payload,
          targetID: originalVersion!.id,
          writeAttempt: 'restoreGlobalVersion',
        }),
      ).rejects.toThrow('Payload writes are not allowed during validation')

      await expect(
        payload.findGlobal({
          slug: validationWriteTargetGlobalSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'latest global target',
      })
    })

    test('should reject an upload that reuses the validation request before a row or file is written', async ({
      payload,
    }) => {
      await fs.mkdir(validationUploadsDir, { recursive: true })

      await expect(runWriteAttempt({ payload, writeAttempt: 'upload' })).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(
        await payload.count({ collection: validationUploadsSlug, overrideAccess: true }),
      ).toEqual({ totalDocs: 0 })
      await expect(fs.stat(path.join(validationUploadsDir, 'blocked.txt'))).rejects.toThrow()
    })

    test('should reject a version save that reuses the validation request before a version is written', async ({
      payload,
    }) => {
      const target = await createWriteTarget({ payload })
      const versionsBefore = await payload.countVersions({
        collection: writeTargetsSlug,
        overrideAccess: true,
        where: {
          parent: {
            equals: target.id,
          },
        },
      })

      await expect(
        runWriteAttempt({ payload, targetID: target.id, writeAttempt: 'version' }),
      ).rejects.toThrow('Payload writes are not allowed during validation')

      const versionsAfter = await payload.countVersions({
        collection: writeTargetsSlug,
        overrideAccess: true,
        where: {
          parent: {
            equals: target.id,
          },
        },
      })
      expect(versionsAfter).toEqual(versionsBefore)
    })

    test('should reject a job queue call that reuses the validation request before a job is written', async ({
      payload,
    }) => {
      const jobsBefore = await payload.count({
        collection: 'payload-jobs',
        overrideAccess: true,
      })

      await expect(runWriteAttempt({ payload, writeAttempt: 'jobsQueue' })).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: 'payload-jobs', overrideAccess: true })).toEqual(
        jobsBefore,
      )
    })

    test('should reject schedule handling before job statistics are written', async ({
      payload,
    }) => {
      const scheduleTask = payload.config.jobs?.tasks?.find(
        ({ slug }) => slug === 'validationWriteGuardProbe',
      )

      if (!scheduleTask) {
        throw new Error('Expected validationWriteGuardProbe task')
      }

      const originalSchedule = scheduleTask.schedule
      const jobsBefore = await payload.count({
        collection: 'payload-jobs',
        overrideAccess: true,
      })
      const statsBefore = structuredClone(
        await payload.db.findGlobal({ slug: 'payload-jobs-stats' }),
      )

      scheduleTask.schedule = [
        {
          cron: '* * * * * *',
          queue: 'validation-write-guard',
        },
      ]

      try {
        const outcome = await runWriteAttempt({
          payload,
          writeAttempt: 'jobsHandleSchedules',
        }).then(
          () => ({ error: null }),
          (error: unknown) => ({ error }),
        )

        expect(await payload.db.findGlobal({ slug: 'payload-jobs-stats' })).toEqual(statsBefore)
        expect(await payload.count({ collection: 'payload-jobs', overrideAccess: true })).toEqual(
          jobsBefore,
        )
        expect(outcome.error).toHaveProperty(
          'message',
          'Payload writes are not allowed during validation.',
        )
      } finally {
        scheduleTask.schedule = originalSchedule
      }
    })

    test('should reject forgot password before the request interval reservation is written', async ({
      payload,
    }) => {
      const originalRequestedAt = '2000-01-01T00:00:00.000Z'
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'validation-write-guard-forgot-password@example.com',
          password: 'correct-password',
        },
        overrideAccess: true,
      })

      await payload.db.updateOne({
        id: user.id,
        collection: 'users',
        data: {
          resetPasswordRequestedAt: originalRequestedAt,
        },
      })

      try {
        await expect(runWriteAttempt({ payload, writeAttempt: 'forgotPassword' })).rejects.toThrow(
          'Payload writes are not allowed during validation',
        )

        const userAfter = await payload.findByID({
          id: user.id,
          collection: 'users',
          overrideAccess: true,
          showHiddenFields: true,
        })

        expect(userAfter.resetPasswordRequestedAt).toEqual(originalRequestedAt)
      } finally {
        await payload.delete({ id: user.id, collection: 'users', overrideAccess: true })
      }
    })

    test('should reject a login that reuses the validation request before login attempts are recorded', async ({
      payload,
    }) => {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'validation-write-guard-login@example.com',
          password: 'correct-password',
        },
        overrideAccess: true,
      })

      try {
        await expect(runWriteAttempt({ payload, writeAttempt: 'login' })).rejects.toThrow(
          'Payload writes are not allowed during validation',
        )

        const userAfter = await payload.findByID({
          id: user.id,
          collection: 'users',
          overrideAccess: true,
          showHiddenFields: true,
        })

        expect(userAfter.loginAttempts).toEqual(0)
      } finally {
        await payload.delete({ id: user.id, collection: 'users', overrideAccess: true })
      }
    })

    test('should reject auth writes that reuse the validation request', async ({ payload }) => {
      for (const writeAttempt of ['logout', 'refresh', 'resetPassword', 'verifyEmail'] as const) {
        const usersBefore = await payload.count({ collection: 'users', overrideAccess: true })

        await expect(runWriteAttempt({ payload, writeAttempt })).rejects.toThrow(
          'Payload writes are not allowed during validation',
        )

        expect(await payload.count({ collection: 'users', overrideAccess: true })).toEqual(
          usersBefore,
        )
      }
    })
  })
})

async function createWriteTarget({ payload }: { payload: Payload }) {
  return payload.create({
    collection: writeTargetsSlug,
    data: {
      title: 'stored target',
    },
    disableTransaction: true,
    overrideAccess: true,
  })
}

function runWriteAttempt({
  payload,
  targetID,
  writeAttempt,
}: {
  payload: Payload
  targetID?: number | string
  writeAttempt:
    | 'create'
    | 'delete'
    | 'deleteMany'
    | 'forgotPassword'
    | 'jobsHandleSchedules'
    | 'jobsQueue'
    | 'login'
    | 'logout'
    | 'refresh'
    | 'resetPassword'
    | 'restoreGlobalVersion'
    | 'restoreVersion'
    | 'update'
    | 'updateGlobal'
    | 'updateMany'
    | 'upload'
    | 'verifyEmail'
    | 'version'
}) {
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

function getPublishCollectionLocaleData({ title }: { title: string }): Record<string, unknown> {
  return {
    localizedArray: [{ value: `${title} array` }],
    localizedBlocks: [{ blockType: 'validationBlock', value: `${title} block` }],
    title,
  }
}

async function seedPublishCollection({
  de,
  deletedAt,
  en,
  es,
  fr,
  payload,
}: {
  de: string
  deletedAt?: string
  en: string
  es: string
  fr?: string
  payload: Payload
}) {
  const draft = await payload.create({
    collection: publishCollectionSlug,
    data: {
      ...getPublishCollectionLocaleData({ title: en }),
      ...(deletedAt ? { deletedAt } : {}),
    },
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })

  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: getPublishCollectionLocaleData({ title: es }),
    draft: true,
    locale: 'es',
    overrideAccess: true,
    trash: Boolean(deletedAt),
  })
  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: getPublishCollectionLocaleData({ title: de }),
    draft: true,
    locale: 'de',
    overrideAccess: true,
    trash: Boolean(deletedAt),
  })
  if (fr !== undefined) {
    await payload.update({
      id: draft.id,
      collection: publishCollectionSlug,
      data: getPublishCollectionLocaleData({ title: fr }),
      draft: true,
      locale: 'fr',
      overrideAccess: true,
      trash: Boolean(deletedAt),
    })
  }

  return draft
}

function getPublishGlobalLocaleData({ title }: { title: string }): Record<string, unknown> {
  return {
    localizedArray: [{ value: `${title} array` }],
    localizedBlocks: [{ blockType: 'globalValidationBlock', value: `${title} block` }],
    title,
  }
}

async function seedPublishGlobal({
  de,
  en,
  es,
  fr,
  payload,
}: {
  de: string
  en: string
  es: string
  fr?: string
  payload: Payload
}) {
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: {},
    overrideAccess: true,
    unpublishAllLocales: true,
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({ title: en }),
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({ title: es }),
    draft: true,
    locale: 'es',
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({ title: de }),
    draft: true,
    locale: 'de',
    overrideAccess: true,
  })
  if (fr !== undefined) {
    await payload.updateGlobal({
      slug: publishGlobalSlug,
      data: getPublishGlobalLocaleData({
        title: fr,
      }),
      draft: true,
      locale: 'fr',
      overrideAccess: true,
    })
  }
}

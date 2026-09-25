import type { Payload, PayloadRequest } from 'payload'

import { buildEditorState } from '@payloadcms/richtext-lexical'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { createPayloadRequest } from 'payload'
import { getEntityPermissions } from 'payload/internal'
import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

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
  publishCollectionSlug,
  publishGlobalSlug,
  validationAccessSourceGlobalSlug,
  validationAuthCollectionSlug,
  validationCollectionSlug,
  validationCustomButtonsCollectionSlug,
  validationDeniedCollectionSlug,
  validationDeniedGlobalSlug,
  validationDraftSourceGlobalSlug,
  validationFallbackCollectionSlug,
  validationFallbackGlobalSlug,
  validationGlobalSlug,
  validationPublishUploadsDir,
  validationPublishUploadsSlug,
  validationRuntimeIdentityEvents,
  validationUploadsDir,
  validationUploadsSlug,
  validationWhereCollectionSlug,
  validationWriteTargetGlobalSlug,
  writeTargetsSlug,
} from './config.js'

let payload: Payload
let restClient: NextRESTClient

const formatGraphQLID = (id: number | string) =>
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

test.suite('validate Local API', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
    payload = payloadInstance
    restClient = restClientInstance

    await payload.updateGlobal({
      slug: validationGlobalSlug,
      data: {
        location: [-0.12, 51.5],
        metadata: {
          nestedTitle: 'Stored nested title',
        },
        summary: 'stored global summary',
        title: 'Stored global title',
      } as never,
      locale: 'en',
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: validationDraftSourceGlobalSlug,
      data: {
        _status: 'draft',
        scope: 'draft-visible',
        title: 'Draft-only title',
      },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: validationAccessSourceGlobalSlug,
      data: {
        scope: 'stored-private',
        title: 'Stored private title',
      },
      locale: 'en',
      overrideAccess: true,
    })
  })

  test.beforeEach(() => {
    clearValidationEvents()
  })

  test.afterEach(async () => {
    await Promise.all([
      payload.delete({
        collection: publishCollectionSlug,
        disableTransaction: true,
        overrideAccess: true,
        trash: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationAuthCollectionSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationCollectionSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationCustomButtonsCollectionSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationDeniedCollectionSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationFallbackCollectionSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationWhereCollectionSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationUploadsSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationPublishUploadsSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: writeTargetsSlug,
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: 'payload-jobs',
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { exists: true } },
      }),
    ])
    await fs.rm(validationUploadsDir, { force: true, recursive: true })
    await fs.rm(validationPublishUploadsDir, { force: true, recursive: true })
  })

  test.describe('collections', () => {
    test('should enforce collection access by default', async () => {
      await expect(
        payload.validate({
          collection: validationDeniedCollectionSlug,
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
    })

    test('should fall back to collection update access with the validate operation', async () => {
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

    test('should deny collection validation when its update access fallback denies it', async () => {
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
    })

    test('should prefer explicit collection validate access over its update access fallback', async () => {
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

    test('should let an explicit null user override an authenticated reused collection request', async () => {
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

    test('should fall back to field update access with the validate operation', async () => {
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

    test('should prefer explicit field validate access over its update access fallback', async () => {
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

    test('should expose fallback-derived entity and field validation permissions', async () => {
      const req = await createPayloadRequest({
        context: {
          allowFieldUpdateFallback: true,
          allowUpdateFallback: true,
        },
        payload,
      })
      const permissions = await getEntityPermissions({
        blockReferencesPermissions: {},
        entity: payload.collections[validationFallbackCollectionSlug]!.config,
        entityType: 'collection',
        fetchData: false,
        operations: ['validate'],
        req,
      })

      expect(permissions).toMatchObject({
        fields: {
          updateProtected: {
            validate: {
              permission: true,
            },
          },
        },
        validate: {
          permission: true,
        },
      })
      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'collection',
      })
      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'field',
      })
      expect(req.operation).toBeUndefined()
    })

    test('should apply update access fallback constraints to stored collection validation', async () => {
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

    test('should apply validation access to the latest collection draft before the main document', async () => {
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

    test('should not fall back to an allowed main document when the latest draft is denied', async () => {
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

    test('should isolate operation-sensitive entity and nested field permission discovery', async () => {
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
        fields: true,
        validate: true,
      })
      expect(authResult.permissions.globals?.[validationGlobalSlug]).toMatchObject({
        fields: true,
        validate: true,
      })

      const collectionPermissions = await getEntityPermissions({
        blockReferencesPermissions: {},
        entity: payload.collections[validationCollectionSlug]!.config,
        entityType: 'collection',
        fetchData: false,
        operations: ['validate'],
        req,
      })
      const globalPermissions = await getEntityPermissions({
        blockReferencesPermissions: {},
        entity: payload.globals.config.find(({ slug }) => slug === validationGlobalSlug)!,
        entityType: 'global',
        fetchData: false,
        operations: ['validate'],
        req,
      })

      expect(collectionPermissions).toMatchObject({
        fields: {
          permissionProbe: {
            fields: {
              content: {
                blocks: {
                  permissionProbeBlock: {
                    fields: {
                      nested: {
                        validate: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
              nested: {
                validate: {
                  permission: true,
                },
              },
            },
          },
        },
        validate: {
          permission: true,
        },
      })
      expect(globalPermissions).toMatchObject({
        fields: {
          permissionProbe: {
            fields: {
              nested: {
                validate: {
                  permission: true,
                },
              },
            },
          },
        },
        validate: {
          permission: true,
        },
      })
      expect(permissionOperationEvents).not.toHaveLength(0)
      expect(permissionOperationEvents).toSatisfy((events: typeof permissionOperationEvents) =>
        events.every(({ observedOperation, operation }) => observedOperation === operation),
      )
      expect(req.operation).toBe('update')

      clearValidationEvents()

      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          data: {
            permissionProbe: {
              content: [
                {
                  blockType: 'permissionProbeBlock',
                  nested: 'collection block',
                },
              ],
              nested: 'collection nested',
            },
            summary: 'collection summary',
            title: 'Collection title',
          },
          locale: 'en',
          overrideAccess: false,
          req,
        }),
      ).resolves.toEqual({
        errors: [],
        valid: true,
      })
      await expect(
        payload.validateGlobal({
          slug: validationGlobalSlug,
          data: {
            permissionProbe: {
              nested: 'global nested',
            },
          },
          locale: 'en',
          overrideAccess: false,
          req,
        }),
      ).resolves.toEqual({
        errors: [],
        valid: true,
      })
      expect(
        permissionOperationEvents.filter(({ operation }) => operation === 'validate'),
      ).not.toHaveLength(0)
      expect(
        permissionOperationEvents
          .filter(({ operation }) => operation === 'validate')
          .every(({ observedOperation }) => observedOperation === 'validate'),
      ).toBe(true)
      expect(req.operation).toBe('update')
    })

    test('should validate explicit locales and tag only the invalid locale', async () => {
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

    test('should not honor fallbackLocale when the checked locale has no value of its own', async () => {
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

    test('should ignore internal projection flags passed to the public collection validate API', async () => {
      const stored = await payload.create({
        collection: validationCollectionSlug,
        data: {
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
          title: 'Candidate title',
        },
        locale: ['en', 'es'],
        validationDataLocale: 'en',
      } as never)

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    test('should ignore internal trash-source flags passed to the public collection validate API', async () => {
      const stored = await seedPublishCollection({
        de: 'German optional',
        deletedAt: new Date().toISOString(),
        en: 'English draft',
        es: 'Spanish valid',
      })

      await expect(
        payload.validate({
          id: stored.id,
          collection: publishCollectionSlug,
          locale: 'en',
          validationTrash: true,
        } as never),
      ).rejects.toThrow(/not found/i)
    })

    test('should resolve all to every available locale through locale filtering', async () => {
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

    test('should not duplicate a non-localized field error once per resolved locale', async () => {
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

    test('should preserve locale information for a stored localized field inside an omitted array', async () => {
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

    test('should preserve locale information when an omitted array hook returns a nested localized error', async () => {
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

    test('should preserve different messages for one non-localized path', async () => {
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

    test('should deduplicate explicit locales in deterministic order', async () => {
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

    test('should reject empty, unknown, and unavailable locale selectors', async () => {
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

    test('should cap concurrent locale passes at three with isolated request state', async () => {
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

    test('should isolate mutable access data and request state between collection locale passes', async () => {
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

    test('should return field errors for invalid create data without creating a document', async () => {
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

    test('should require a username or email for auth collection create validation', async () => {
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

    test('should prevent clearing both username and email during auth collection validation', async () => {
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

    test('should return a successful result for valid create data', async () => {
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

    test('should run validation hooks in order with the validate operation and unchanged context', async () => {
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

    test('should pass the validate operation into fields nested inside a Lexical block', async () => {
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
    })

    test('should pass the validate operation into beforeChange hooks nested inside a Lexical block', async () => {
      const result = await payload.validate({
        collection: validationCollectionSlug,
        data: {
          blockRichText: buildNestedFieldValidateBlockRichText('nested block value'),
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: 'en',
      })

      expect(result.valid).toBe(true)

      const nestedBlockFieldBeforeChangeEvent = hookEvents.find(
        ({ hook }) => hook === 'nestedBlockFieldBeforeChange',
      )
      expect(nestedBlockFieldBeforeChangeEvent).toBeDefined()
      expect(nestedBlockFieldBeforeChangeEvent?.operation).toBe('validate')
      expect(nestedBlockFieldBeforeChangeEvent?.requestOperation).toBe('validate')
    })

    test('should apply defaults before validating required fields', async () => {
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

    test('should reject create simulation without data at runtime', async () => {
      await expect(
        payload.validate({
          collection: validationCollectionSlug,
          locale: 'en',
        } as never),
      ).rejects.toThrow('Validation create simulation requires data')
    })

    test('should reject a missing locale at runtime', async () => {
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

    test('should merge partial update data over the stored locale without persisting it', async () => {
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

    test('should use after-read values from a stored collection document', async () => {
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

    test('should classify errors using data returned from collection hooks', async () => {
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

    test('should keep collection creates as drafts when publishAllLocales is requested', async () => {
      const draft = await payload.create({
        collection: publishCollectionSlug,
        data: getPublishCollectionLocaleData({ title: 'English draft' }),
        draft: true,
        locale: 'en',
        overrideAccess: true,
        publishAllLocales: true,
      })

      expect(draft._status).toBe('draft')
    })

    test('should keep collection updates as drafts when publishAllLocales is requested', async () => {
      const draft = await seedPublishCollection({
        de: 'German draft',
        en: 'English draft',
        es: 'Spanish draft',
      })

      const updatedDraft = await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          title: 'Updated English draft',
        },
        draft: true,
        locale: 'en',
        overrideAccess: true,
        publishAllLocales: true,
      })

      expect(updatedDraft._status).toBe('draft')
    })

    test('should use the published collection as the validation base unless draft is true', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish valid',
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

    test('should validate a partial update with an unchanged stored point representation', async () => {
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

    test('should execute first-class collection validation access and throw on denial', async () => {
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

    test('should restore the caller request operation after a collection hook throws', async () => {
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

    test('should return a validation result instead of throwing when a collection hook throws a ValidationError', async () => {
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

    test('should return a validation result when a collection field beforeValidate hook throws a ValidationError', async () => {
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
    test('should enforce global access by default', async () => {
      await expect(
        payload.validateGlobal({
          slug: validationDeniedGlobalSlug,
          data: {
            title: 'Candidate title',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        status: 403,
      })
    })

    test('should fall back to global update access with the validate operation', async () => {
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

    test('should deny global validation when its update access fallback denies it', async () => {
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
    })

    test('should let an explicit null user override an authenticated reused global request', async () => {
      const req = {
        user: {
          id: 'authenticated-user',
          collection: validationCollectionSlug,
        } as never,
      } satisfies Partial<PayloadRequest>

      await expect(
        payload.validateGlobal({
          slug: validationFallbackGlobalSlug,
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

    test('should fall back to global field update access with the validate operation', async () => {
      const excludedResult = await payload.validateGlobal({
        slug: validationFallbackGlobalSlug,
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

      const includedResult = await payload.validateGlobal({
        slug: validationFallbackGlobalSlug,
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

    test('should expose fallback-derived global and field validation permissions', async () => {
      const req = await createPayloadRequest({
        context: {
          allowFieldUpdateFallback: true,
          allowUpdateFallback: true,
        },
        payload,
      })
      const permissions = await getEntityPermissions({
        blockReferencesPermissions: {},
        entity: payload.globals.config.find(({ slug }) => slug === validationFallbackGlobalSlug)!,
        entityType: 'global',
        fetchData: false,
        operations: ['validate'],
        req,
      })

      expect(permissions).toMatchObject({
        fields: {
          updateProtected: {
            validate: {
              permission: true,
            },
          },
        },
        validate: {
          permission: true,
        },
      })
      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'global',
      })
      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'field',
      })
      expect(req.operation).toBeUndefined()
    })

    test('should prefer explicit global validate access over its update access fallback', async () => {
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

    test('should load a draft-only global only when draft validation is requested', async () => {
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

    test('should resolve an access-constrained draft when no matching main global exists', async () => {
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

    test('should not fall back to an allowed main global when the latest draft is denied', async () => {
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

    test('should reject a Where policy that filters out the persisted main global', async () => {
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

    test('should ignore internal projection flags passed to the public global validate API', async () => {
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        data: {
          summary: 'candidate summary',
          title: 'Candidate title',
        },
        locale: ['en', 'es'],
        validationDataLocale: 'en',
      } as never)

      expect(result).toEqual({
        errors: [],
        valid: true,
      })
    })

    test('should isolate mutable access data and request state between global locale passes', async () => {
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
      const req = {
        data: requestData,
        headers: new Headers({ 'x-validation-isolation': 'caller' }),
        query,
        responseHeaders: new Headers({ 'x-validation-isolation': 'caller' }),
        routeParams,
      } satisfies Partial<PayloadRequest>

      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        context,
        data: candidateData,
        locale: ['en', 'es'],
        overrideAccess: false,
        req,
        user: user as never,
      })

      expect(result.valid).toBe(true)
      expect(isolationEvents.map(({ locale, source }) => ({ locale, source }))).toEqual([
        { locale: 'en', source: 'global' },
        { locale: 'es', source: 'global' },
      ])
      expect(
        isolationEvents.every(
          ({
            candidateMarker,
            contextMarker,
            headerMarker,
            queryMarker,
            requestDataMarker,
            responseHeaderMarker,
            routeMarker,
            userMarker,
          }) =>
            candidateMarker === 'caller' &&
            contextMarker === 'caller' &&
            headerMarker === 'caller' &&
            queryMarker === 'caller' &&
            requestDataMarker === 'caller' &&
            responseHeaderMarker === 'caller' &&
            routeMarker === 'caller' &&
            userMarker === 'caller',
        ),
      ).toBe(true)
      expect(candidateData.isolation.marker).toBe('caller')
      expect(context.isolation.marker).toBe('caller')
      expect(requestData.isolation.marker).toBe('caller')
      expect(query.isolation.marker).toBe('caller')
      expect(req.headers.get('x-validation-isolation')).toBe('caller')
      expect(req.responseHeaders.get('x-validation-isolation')).toBe('caller')
      expect(routeParams.isolation.marker).toBe('caller')
      expect(user.isolation.marker).toBe('caller')
    })

    test('should validate valid partial global data without persisting it', async () => {
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

    test('should return errors for invalid partial global data without persisting it', async () => {
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

    test('should validate partial global data with an unchanged stored point representation', async () => {
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

    test('should use after-read values from a stored global document', async () => {
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

    test('should classify errors using data returned from global hooks', async () => {
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        context: {
          replaceSharedBlockWithLocalizedBlock: true,
        },
        data: {
          hookReplacedBlocks: [
            {
              blockType: 'sharedGlobalValidationBlock',
              value: 'shared value',
            },
          ],
          summary: 'candidate global summary',
          title: 'Candidate global title',
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

    test('should keep global updates as drafts when publishAllLocales is requested', async () => {
      const draft = await payload.updateGlobal({
        slug: publishGlobalSlug,
        data: getPublishGlobalLocaleData({ title: 'English draft' }),
        draft: true,
        locale: 'en',
        overrideAccess: true,
        publishAllLocales: true,
      })

      expect(draft._status).toBe('draft')
    })

    test('should use the published global as the validation base unless draft is true', async () => {
      await seedPublishGlobal({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish valid',
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

    test('should execute first-class global validation access and throw on denial', async () => {
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

    test('should restore the caller request operation after a global hook throws', async () => {
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

    test('should return a validation result instead of throwing when a global hook throws a ValidationError', async () => {
      const result = await payload.validateGlobal({
        slug: validationGlobalSlug,
        context: {
          throwValidationErrorHook: true,
        },
        locale: 'en',
      })

      expect(result).toEqual({
        errors: [
          expect.objectContaining({
            message: 'Global hook validation failure',
            path: 'title',
          }),
        ],
        valid: false,
      })
    })

    test('should return a validation result when a global field beforeValidate hook throws a ValidationError', async () => {
      await expect(
        payload.validateGlobal({
          slug: validationGlobalSlug,
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
            message: 'Global field validation failure',
            path: 'title',
          }),
        ],
        valid: false,
      })
    })
  })

  test.describe('REST API', () => {
    test('should use collection update access when validate access is not configured', async () => {
      const response = await restClient.POST(
        `/${validationFallbackCollectionSlug}/validate?locale=en`,
        {
          body: JSON.stringify({
            title: 'Candidate title',
          }),
        },
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'collection',
      })
    })

    test('should use global update access when validate access is not configured', async () => {
      const response = await restClient.POST(
        `/globals/${validationFallbackGlobalSlug}/validate?locale=en`,
        {
          body: JSON.stringify({
            title: 'Candidate title',
          }),
        },
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        errors: [],
        valid: true,
      })
      expect(fallbackAccessEvents).toContainEqual({
        operation: 'validate',
        source: 'global',
      })
    })

    test('should deny global REST validation when explicit validate access denies it', async () => {
      const response = await restClient.POST(
        `/globals/${validationDeniedGlobalSlug}/validate?locale=en`,
        {
          body: JSON.stringify({
            title: 'Candidate title',
          }),
        },
      )

      expect(response.status).toBe(403)
    })

    test('should return 404 for a nonexistent collection document', async () => {
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

    test('should return invalid collection create validation without creating a document', async () => {
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
      expect(
        await payload.count({ collection: validationCollectionSlug, overrideAccess: true }),
      ).toEqual({
        totalDocs: 0,
      })
    })

    test('should return valid collection create validation', async () => {
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

    test('should return 400 for missing or empty locales and malformed data', async () => {
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

    test('should accept repeated and all locale selectors', async () => {
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

    test('should use the latest collection draft as the REST validation base', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish valid',
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

      const response = await restClient.POST(
        `/${publishCollectionSlug}/${draft.id}/validate?locale=en`,
      )

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
    })

    test('should use the latest global draft as the REST validation base', async () => {
      await seedPublishGlobal({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish valid',
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

      const response = await restClient.POST(`/globals/${publishGlobalSlug}/validate?locale=en`)

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
    })

    test('should merge by-ID validation data without persisting it', async () => {
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

    test('should validate global data without persisting it', async () => {
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

    test('should return valid global validation without persisting it', async () => {
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

    test('should deny collection REST validation when explicit validate access denies it', async () => {
      const response = await restClient.POST(
        `/${validationDeniedCollectionSlug}/validate?locale=en`,
        {
          body: JSON.stringify({
            title: 'Candidate title',
          }),
        },
      )

      expect(response.status).toBe(403)
    })

    test('should keep body control-shaped fields as data without changing trusted access inputs', async () => {
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

    test('should validate each requested locale independently when sibling localized fields are omitted', async () => {
      const draft = await payload.create({
        collection: validationCustomButtonsCollectionSlug,
        data: {
          _status: 'draft',
          summary: 'Shared summary',
          title: 'English title',
        },
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })
      await payload.update({
        id: draft.id,
        collection: validationCustomButtonsCollectionSlug,
        data: {
          _status: 'draft',
          title: 'Deutscher Titel',
        },
        draft: true,
        locale: 'de',
        overrideAccess: true,
      })

      // This collection uses the default access control, which requires an
      // authenticated admin user, so the shared restClient needs a token here.
      const adminEmail = 'validate-custom-buttons-admin@example.com'
      const adminUser = await payload.create({
        collection: 'users',
        data: {
          email: adminEmail,
          password: devUser.password,
        },
        overrideAccess: true,
      })

      try {
        const { token } = await payload.login({
          collection: 'users',
          data: {
            email: adminEmail,
            password: devUser.password,
          },
        })
        const authHeaders = { Authorization: `JWT ${token}` }

        const activeLocaleResponse = await restClient.POST(
          `/${validationCustomButtonsCollectionSlug}/${draft.id}/validate?locale=en`,
          {
            body: JSON.stringify({
              summary: 'Shared summary',
              title: 'English title',
            }),
            headers: authHeaders,
          },
        )

        expect(activeLocaleResponse.status).toBe(200)
        await expect(activeLocaleResponse.json()).resolves.toEqual({
          errors: [],
          valid: true,
        })

        const siblingLocalesResponse = await restClient.POST(
          `/${validationCustomButtonsCollectionSlug}/${draft.id}/validate?locale=de&locale=es&locale=fr`,
          {
            body: JSON.stringify({
              summary: 'Shared summary',
            }),
            headers: authHeaders,
          },
        )
        const siblingResult = await siblingLocalesResponse.json()

        expect(siblingLocalesResponse.status).toBe(200)
        expect(siblingResult.valid).toBe(false)
        expect(siblingResult.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ locale: 'es', path: 'title' }),
            expect.objectContaining({ locale: 'fr', path: 'title' }),
          ]),
        )
        expect(siblingResult.errors).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ locale: 'de', path: 'title' })]),
        )
      } finally {
        await payload.delete({ id: adminUser.id, collection: 'users', overrideAccess: true })
      }
    })
  })

  test.describe('GraphQL API', () => {
    let graphqlUserID: number | string

    test.beforeAll(async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'validation-graphql-api@example.com',
          password: 'validation-graphql-api-password',
        },
        overrideAccess: true,
      })
      graphqlUserID = user.id

      await restClient.login({
        slug: 'users',
        credentials: {
          email: 'validation-graphql-api@example.com',
          password: 'validation-graphql-api-password',
        },
      })
    })

    test.afterAll(async () => {
      await payload.delete({ id: graphqlUserID, collection: 'users', overrideAccess: true })
    })

    test('should return a validation result for an invalid collection create candidate without persisting it', async () => {
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

    test('should return a valid result for a valid collection create candidate', async () => {
      const query = `mutation {
        validateValidationWriteTarget(data: { title: "GraphQL candidate" }) {
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

      expect(data.validateValidationWriteTarget).toEqual({ errors: [], valid: true })
    })

    test('should validate a collection create candidate with a custom ID', async () => {
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

    test('should validate an empty collection create candidate without a data argument', async () => {
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

    test('should validate a stored collection document by id without persisting the candidate', async () => {
      const target = await createWriteTarget()

      const query = `mutation {
        validateValidationWriteTarget(id: ${formatGraphQLID(target.id)}, data: { title: "" }) {
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

    test('should return a validation result for a global document', async () => {
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

    test('should accept partial global validation data at every nesting level', async () => {
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

    test('should isolate transaction IDs between GraphQL validation resolvers', async () => {
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
    test('should reject a create that reuses the validation request before a row is written', async () => {
      await expect(runWriteAttempt('create')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: writeTargetsSlug, overrideAccess: true })).toEqual({
        totalDocs: 0,
      })
    })

    test('should reject an update that reuses the validation request before a row is written', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('update', target.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'stored target',
      })
    })

    test('should reject a bulk update that reuses the validation request before a row is written', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('updateMany', target.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'stored target',
      })
    })

    test('should reject a delete that reuses the validation request before a row is removed', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('delete', target.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'stored target',
      })
    })

    test('should reject a bulk delete that reuses the validation request before a row is removed', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('deleteMany', target.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findByID({
          id: target.id,
          collection: writeTargetsSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'stored target',
      })
    })

    test('should reject a global update that reuses the validation request before data is written', async () => {
      await payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'stored global target',
        },
        overrideAccess: true,
      })

      await expect(runWriteAttempt('updateGlobal')).rejects.toThrow(
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

    test('should reject a collection version restore before the document is written', async () => {
      const target = await createWriteTarget()

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

      await expect(runWriteAttempt('restoreVersion', originalVersion!.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

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

    test('should reject a global version restore before the global is written', async () => {
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

      await expect(runWriteAttempt('restoreGlobalVersion', originalVersion!.id)).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findGlobal({
          slug: validationWriteTargetGlobalSlug,
          overrideAccess: true,
        }),
      ).resolves.toMatchObject({
        title: 'latest global target',
      })
    })

    test('should reject an upload that reuses the validation request before a row or file is written', async () => {
      await fs.mkdir(validationUploadsDir, { recursive: true })

      await expect(runWriteAttempt('upload')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(
        await payload.count({ collection: validationUploadsSlug, overrideAccess: true }),
      ).toEqual({ totalDocs: 0 })
      await expect(fs.stat(path.join(validationUploadsDir, 'blocked.txt'))).rejects.toThrow()
    })

    test('should reject a version save that reuses the validation request before a version is written', async () => {
      const target = await createWriteTarget()
      const versionsBefore = await payload.countVersions({
        collection: writeTargetsSlug,
        overrideAccess: true,
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
        overrideAccess: true,
        where: {
          parent: {
            equals: target.id,
          },
        },
      })
      expect(versionsAfter).toEqual(versionsBefore)
    })

    test('should reject a job queue call that reuses the validation request before a job is written', async () => {
      const jobsBefore = await payload.count({
        collection: 'payload-jobs',
        overrideAccess: true,
      })

      await expect(runWriteAttempt('jobsQueue')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: 'payload-jobs', overrideAccess: true })).toEqual(
        jobsBefore,
      )
    })

    test('should reject schedule handling before job statistics are written', async () => {
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
        const outcome = await runWriteAttempt('jobsHandleSchedules').then(
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

    test('should reject forgot password before the request interval reservation is written', async () => {
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
        await expect(runWriteAttempt('forgotPassword')).rejects.toThrow(
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

    test('should reject a login that reuses the validation request before login attempts are recorded', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'validation-write-guard-login@example.com',
          password: 'correct-password',
        },
        overrideAccess: true,
      })

      try {
        await expect(runWriteAttempt('login')).rejects.toThrow(
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

    test('should reject a logout that reuses the validation request before a session is removed', async () => {
      const usersBefore = await payload.count({ collection: 'users', overrideAccess: true })

      await expect(runWriteAttempt('logout')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: 'users', overrideAccess: true })).toEqual(
        usersBefore,
      )
    })

    test('should reject a refresh that reuses the validation request before a session is written', async () => {
      const usersBefore = await payload.count({ collection: 'users', overrideAccess: true })

      await expect(runWriteAttempt('refresh')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: 'users', overrideAccess: true })).toEqual(
        usersBefore,
      )
    })

    test('should reject a reset password that reuses the validation request before a password is written', async () => {
      const usersBefore = await payload.count({ collection: 'users', overrideAccess: true })

      await expect(runWriteAttempt('resetPassword')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: 'users', overrideAccess: true })).toEqual(
        usersBefore,
      )
    })

    test('should reject a verify email that reuses the validation request before a user is written', async () => {
      const usersBefore = await payload.count({ collection: 'users', overrideAccess: true })

      await expect(runWriteAttempt('verifyEmail')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      expect(await payload.count({ collection: 'users', overrideAccess: true })).toEqual(
        usersBefore,
      )
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
    overrideAccess: true,
  })
}

async function runWriteAttempt(
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
    | 'version',
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

type PublishCollectionLocalizedField =
  | 'localizedArray'
  | 'localizedBlocks'
  | 'localizedGroup'
  | 'localizedJSON'
  | 'localizedRichText'
  | 'localizedTab'
  | 'nested.localizedJSON'

function getPublishCollectionLocaleData({
  omit = [],
  title,
}: {
  omit?: PublishCollectionLocalizedField[]
  title: string
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    localizedArray: [{ value: `${title} array` }],
    localizedBlocks: [{ blockType: 'validationBlock', value: `${title} block` }],
    localizedGroup: { value: `${title} group` },
    localizedJSON: { value: `${title} JSON` },
    localizedRichText: buildEditorState({ text: `${title} rich text` }),
    localizedTab: { value: `${title} tab` },
    nested: {
      localizedJSON: { value: `${title} nested JSON` },
      shared: 'shared value',
    },
    title,
  }

  for (const field of omit) {
    if (field === 'nested.localizedJSON') {
      delete (data.nested as Record<string, unknown>).localizedJSON
    } else if (field === 'localizedArray' || field === 'localizedBlocks') {
      data[field] = []
    } else {
      delete data[field]
    }
  }

  return data
}

async function seedPublishCollection({
  de,
  deletedAt,
  en,
  es,
  fr,
  omit,
}: {
  de: string
  deletedAt?: string
  en: string
  es: string
  fr?: string
  omit?: Partial<Record<'de' | 'en' | 'es', PublishCollectionLocalizedField[]>>
}) {
  const draft = await payload.create({
    collection: publishCollectionSlug,
    data: {
      ...getPublishCollectionLocaleData({ omit: omit?.en, title: en }),
      ...(deletedAt ? { deletedAt } : {}),
    },
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })

  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: getPublishCollectionLocaleData({ omit: omit?.es, title: es }),
    draft: true,
    locale: 'es',
    overrideAccess: true,
    trash: Boolean(deletedAt),
  })
  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: getPublishCollectionLocaleData({ omit: omit?.de, title: de }),
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

function getPublishGlobalLocaleData({
  includeLocalizedJSON = true,
  title,
}: {
  includeLocalizedJSON?: boolean
  title: string
}): Record<string, unknown> {
  return {
    localizedJSON: includeLocalizedJSON ? { value: `${title} JSON` } : null,
    title,
  }
}

async function seedPublishGlobal({
  de,
  en,
  es,
  fr,
  omitLocalizedJSON,
}: {
  de: string
  en: string
  es: string
  fr?: string
  omitLocalizedJSON?: Partial<Record<'de' | 'en' | 'es', boolean>>
}) {
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: {},
    overrideAccess: true,
    unpublishAllLocales: true,
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({
      includeLocalizedJSON: !omitLocalizedJSON?.en,
      title: en,
    }),
    draft: true,
    locale: 'en',
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({
      includeLocalizedJSON: !omitLocalizedJSON?.es,
      title: es,
    }),
    draft: true,
    locale: 'es',
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({
      includeLocalizedJSON: !omitLocalizedJSON?.de,
      title: de,
    }),
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

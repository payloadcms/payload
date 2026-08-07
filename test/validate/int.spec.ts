import type { Payload, PayloadRequest } from 'payload'

import { buildEditorState } from '@payloadcms/richtext-lexical'
import fs from 'fs/promises'
import path from 'path'
import { createLocalReq, getFileByPath } from 'payload'
import { getEntityPermissions } from 'payload/internal'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import {
  accessEvents,
  clearValidationEvents,
  fallbackAccessEvents,
  getLocalePassRequestCount,
  getMaximumActiveLocalePasses,
  globalValidationSourceEvents,
  hookEvents,
  isolationEvents,
  localeFilterOperationEvents,
  localePassEvents,
  permissionOperationEvents,
  publishCollectionSlug,
  publishGlobalSlug,
  scheduledValidationEvents,
  validationAccessSourceGlobalSlug,
  validationCollectionSlug,
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
    await payload.updateGlobal({
      slug: validationDraftSourceGlobalSlug,
      data: {
        _status: 'draft',
        scope: 'draft-visible',
        title: 'Draft-only title',
      },
      draft: true,
      locale: 'en',
    })
    await payload.updateGlobal({
      slug: validationAccessSourceGlobalSlug,
      data: {
        scope: 'stored-private',
        title: 'Stored private title',
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
        trash: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationCollectionSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationDeniedCollectionSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationFallbackCollectionSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationWhereCollectionSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationUploadsSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: validationPublishUploadsSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: writeTargetsSlug,
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
      payload.delete({
        collection: 'payload-jobs',
        disableTransaction: true,
        where: { id: { exists: true } },
      }),
    ])
    await fs.rm(validationUploadsDir, { force: true, recursive: true })
    await fs.rm(validationPublishUploadsDir, { force: true, recursive: true })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('collections', () => {
    it('should fall back to collection update access with the validate operation', async () => {
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

    it('should deny collection validation when its update access fallback denies it', async () => {
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

    it('should prefer explicit collection validate access over its update access fallback', async () => {
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

    it('should let an explicit null user override an authenticated reused collection request', async () => {
      const req = {
        user: {
          collection: validationCollectionSlug,
          id: 'authenticated-user',
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

    it('should fall back to field update access with the validate operation', async () => {
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

    it('should prefer explicit field validate access over its update access fallback', async () => {
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

    it('should expose fallback-derived entity and field validation permissions', async () => {
      const req = await createLocalReq(
        {
          context: {
            allowFieldUpdateFallback: true,
            allowUpdateFallback: true,
          },
        },
        payload,
      )
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

    it('should apply update access fallback constraints to stored collection validation', async () => {
      const stored = await payload.create({
        collection: validationWhereCollectionSlug,
        data: {
          scope: 'allowed',
          title: 'Stored title',
        },
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

    it('should isolate operation-sensitive entity and nested field permission discovery', async () => {
      const req = await createLocalReq(
        {
          context: {
            allowValidation: true,
          },
        },
        payload,
      )
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

    it('should ignore internal projection flags passed to the public collection validate API', async () => {
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

    it('should ignore internal trash-source flags passed to the public collection validate API', async () => {
      const stored = await seedPublishCollection({
        de: 'German optional',
        deletedAt: new Date().toISOString(),
        en: 'English draft',
        es: 'Spanish required',
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
      expect(localeFilterOperationEvents).toEqual(['validate'])
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

    it('should isolate mutable access data and request state between collection locale passes', async () => {
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

    it('should use the published collection as the validation base unless draft is true', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
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
      await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          title: '',
        },
        draft: true,
        locale: 'en',
      })

      const versionsBefore = await payload.countVersions({
        collection: publishCollectionSlug,
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
      })
      const draftAfter = await payload.findByID({
        id: draft.id,
        collection: publishCollectionSlug,
        draft: true,
        locale: 'en',
      })
      const versionsAfter = await payload.countVersions({
        collection: publishCollectionSlug,
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
    it('should fall back to global update access with the validate operation', async () => {
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

    it('should deny global validation when its update access fallback denies it', async () => {
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

    it('should let an explicit null user override an authenticated reused global request', async () => {
      const req = {
        user: {
          collection: validationCollectionSlug,
          id: 'authenticated-user',
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

    it('should fall back to global field update access with the validate operation', async () => {
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

    it('should expose fallback-derived global and field validation permissions', async () => {
      const req = await createLocalReq(
        {
          context: {
            allowFieldUpdateFallback: true,
            allowUpdateFallback: true,
          },
        },
        payload,
      )
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

    it('should prefer explicit global validate access over its update access fallback', async () => {
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

    it('should load a draft-only global only when draft validation is requested', async () => {
      const versionsBefore = await payload.countGlobalVersions({
        global: validationDraftSourceGlobalSlug,
      })

      const draftResult = await payload.validateGlobal({
        slug: validationDraftSourceGlobalSlug,
        draft: true,
        locale: 'en',
      })
      const defaultResult = await payload.validateGlobal({
        slug: validationDraftSourceGlobalSlug,
        locale: 'en',
      })
      const mainResult = await payload.validateGlobal({
        slug: validationDraftSourceGlobalSlug,
        draft: false,
        locale: 'en',
      })
      const versionsAfter = await payload.countGlobalVersions({
        global: validationDraftSourceGlobalSlug,
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

    it('should resolve an access-constrained draft when no matching main global exists', async () => {
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

    it('should reject a Where policy that filters out the persisted main global', async () => {
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

    it('should ignore internal projection flags passed to the public global validate API', async () => {
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

    it('should isolate mutable access data and request state between global locale passes', async () => {
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
      expect(localeFilterOperationEvents).toEqual(['validate'])
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

    it('should use the published global as the validation base unless draft is true', async () => {
      await seedPublishGlobal({
        de: 'German optional',
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
      await payload.updateGlobal({
        slug: publishGlobalSlug,
        data: {
          title: '',
        },
        draft: true,
        locale: 'en',
      })

      const versionsBefore = await payload.countGlobalVersions({
        global: publishGlobalSlug,
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
      })
      const draftAfter = await payload.findGlobal({
        slug: publishGlobalSlug,
        draft: true,
        locale: 'en',
      })
      const versionsAfter = await payload.countGlobalVersions({
        global: publishGlobalSlug,
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
    it('should use collection update access when validate access is not configured', async () => {
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

    it('should use global update access when validate access is not configured', async () => {
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

    it('should deny global REST validation when explicit validate access denies it', async () => {
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

    it('should use the latest collection draft as the REST validation base', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
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
      await payload.update({
        id: draft.id,
        collection: publishCollectionSlug,
        data: {
          title: '',
        },
        draft: true,
        locale: 'en',
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

    it('should use the latest global draft as the REST validation base', async () => {
      await seedPublishGlobal({
        de: 'German optional',
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
      await payload.updateGlobal({
        slug: publishGlobalSlug,
        data: {
          title: '',
        },
        draft: true,
        locale: 'en',
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

    it('should deny collection REST validation when explicit validate access denies it', async () => {
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

    it('should reject a bulk update that reuses the validation request before a row is written', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('updateMany', target.id)).rejects.toThrow(
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

    it('should reject a bulk delete that reuses the validation request before a row is removed', async () => {
      const target = await createWriteTarget()

      await expect(runWriteAttempt('deleteMany', target.id)).rejects.toThrow(
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

    it('should reject a global update that reuses the validation request before data is written', async () => {
      await payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'stored global target',
        },
      })

      await expect(runWriteAttempt('updateGlobal')).rejects.toThrow(
        'Payload writes are not allowed during validation',
      )

      await expect(
        payload.findGlobal({
          slug: validationWriteTargetGlobalSlug,
        }),
      ).resolves.toMatchObject({
        title: 'stored global target',
      })
    })

    it('should reject a collection version restore before the document is written', async () => {
      const target = await createWriteTarget()

      await payload.update({
        id: target.id,
        collection: writeTargetsSlug,
        data: {
          title: 'latest target',
        },
        disableTransaction: true,
      })

      const versions = await payload.findVersions({
        collection: writeTargetsSlug,
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
        }),
      ).resolves.toMatchObject({
        title: 'latest target',
      })
    })

    it('should reject a global version restore before the global is written', async () => {
      await payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'stored global target',
        },
      })
      await payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'latest global target',
        },
      })

      const versions = await payload.findGlobalVersions({
        slug: validationWriteTargetGlobalSlug,
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
        }),
      ).resolves.toMatchObject({
        title: 'latest global target',
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
    it('should not require validate access after collection create access succeeds', async () => {
      await expect(
        payload.create({
          collection: validationDeniedCollectionSlug,
          data: {
            _status: 'published',
            title: 'Published with create access',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).resolves.toMatchObject({
        _status: 'published',
        title: 'Published with create access',
      })
    })

    it('should not require validate access after global update access succeeds', async () => {
      await expect(
        payload.updateGlobal({
          slug: validationDeniedGlobalSlug,
          data: {
            _status: 'published',
            title: 'Published with update access',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).resolves.toMatchObject({
        _status: 'published',
        title: 'Published with update access',
      })
    })

    it('should validate the complete publish candidate despite restrictive validate field access', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English title',
        es: '',
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          context: {
            denyPublishFieldValidation: true,
          },
          data: {
            _status: 'published',
          },
          locale: 'en',
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'es',
              path: 'title',
            }),
          ]),
        },
      })
    })

    it('should preserve upload files and persisted state when replacement publish validation fails', async () => {
      const originalFile = await getFileByPath(path.resolve(dirname, '../uploads/image.png'))
      originalFile.name = 'validation-published-original.png'

      const draft = await payload.create({
        collection: validationPublishUploadsSlug,
        data: {
          _status: 'draft',
          title: 'English title',
        },
        draft: true,
        file: originalFile,
        locale: 'en',
      })

      await payload.update({
        id: draft.id,
        collection: validationPublishUploadsSlug,
        data: {
          _status: 'draft',
          title: 'Spanish title',
        },
        draft: true,
        locale: 'es',
      })
      await payload.update({
        id: draft.id,
        collection: validationPublishUploadsSlug,
        data: {
          _status: 'published',
          title: 'English title',
        },
        locale: 'en',
      })
      await payload.update({
        id: draft.id,
        collection: validationPublishUploadsSlug,
        data: {
          _status: 'draft',
          title: '',
        },
        draft: true,
        locale: 'es',
      })

      const mainBefore = await payload.findByID({
        id: draft.id,
        collection: validationPublishUploadsSlug,
        locale: 'all',
      })
      const draftBefore = await payload.findByID({
        id: draft.id,
        collection: validationPublishUploadsSlug,
        draft: true,
        locale: 'all',
      })
      const versionsBefore = await payload.countVersions({
        collection: validationPublishUploadsSlug,
        where: {
          parent: {
            equals: draft.id,
          },
        },
      })
      const filenamesBefore = (await fs.readdir(validationPublishUploadsDir)).sort()
      const fileContentsBefore = new Map(
        await Promise.all(
          filenamesBefore.map(async (filename) => [
            filename,
            await fs.readFile(path.join(validationPublishUploadsDir, filename)),
          ]),
        ),
      )

      expect(filenamesBefore).toEqual(
        expect.arrayContaining([mainBefore.filename, mainBefore.sizes.thumbnail.filename]),
      )

      const replacementFile = await getFileByPath(path.resolve(dirname, '../uploads/small.png'))
      replacementFile.name = 'validation-rejected-replacement.png'

      await expect(
        payload.update({
          id: draft.id,
          collection: validationPublishUploadsSlug,
          data: {
            _status: 'published',
            title: 'Replacement title',
          },
          file: replacementFile,
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'es',
              path: 'title',
            }),
          ]),
        },
      })

      const mainAfter = await payload.findByID({
        id: draft.id,
        collection: validationPublishUploadsSlug,
        locale: 'all',
      })
      const draftAfter = await payload.findByID({
        id: draft.id,
        collection: validationPublishUploadsSlug,
        draft: true,
        locale: 'all',
      })
      const versionsAfter = await payload.countVersions({
        collection: validationPublishUploadsSlug,
        where: {
          parent: {
            equals: draft.id,
          },
        },
      })
      const filenamesAfter = (await fs.readdir(validationPublishUploadsDir)).sort()

      expect(mainAfter).toEqual(mainBefore)
      expect(draftAfter).toEqual(draftBefore)
      expect(versionsAfter).toEqual(versionsBefore)
      expect(filenamesAfter).toEqual(filenamesBefore)

      for (const [filename, contents] of fileContentsBefore) {
        await expect(
          fs.readFile(path.join(validationPublishUploadsDir, filename)),
        ).resolves.toEqual(contents)
      }
    })

    it('should block collection create when a hook promotes a draft to published', async () => {
      await expect(
        payload.create({
          collection: publishCollectionSlug,
          context: {
            promoteDraftToPublished: true,
          },
          data: {
            ...getPublishCollectionLocaleData({ title: 'English candidate' }),
            _status: 'draft',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'es',
              path: 'title',
            }),
          ]),
        },
      })

      const documents = await payload.find({
        collection: publishCollectionSlug,
        draft: true,
        limit: 1,
        locale: 'all',
      })

      expect(documents.totalDocs).toBe(0)
    })

    it('should block collection update when a hook promotes a draft to published', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English draft',
        es: '',
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          context: {
            promoteDraftToPublished: true,
          },
          data: {
            _status: 'draft',
            title: 'English candidate',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'es',
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

    it('should block global update when a hook promotes a draft to published', async () => {
      await seedPublishGlobal({
        de: 'German optional',
        en: 'English draft',
        es: '',
      })

      await expect(
        payload.updateGlobal({
          slug: publishGlobalSlug,
          context: {
            promoteDraftToPublished: true,
          },
          data: {
            _status: 'draft',
            title: 'English candidate',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'es',
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

    it('should block collection create publish-all when status is draft without persisting', async () => {
      await expect(
        payload.create({
          collection: publishCollectionSlug,
          data: {
            ...getPublishCollectionLocaleData({ title: 'English candidate' }),
            _status: 'draft',
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

      const documents = await payload.find({
        collection: publishCollectionSlug,
        draft: true,
        limit: 1,
        locale: 'all',
      })

      expect(documents.totalDocs).toBe(0)
    })

    it('should block collection create publish-all when draft saving is requested', async () => {
      await expect(
        payload.create({
          collection: publishCollectionSlug,
          data: getPublishCollectionLocaleData({ title: 'English candidate' }),
          draft: true,
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

      const documents = await payload.find({
        collection: publishCollectionSlug,
        draft: true,
        limit: 1,
        locale: 'all',
      })

      expect(documents.totalDocs).toBe(0)
    })

    it('should block collection publish-all when status is draft without changing status', async () => {
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
            _status: 'draft',
            title: 'English candidate',
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

      expect(latestDraft._status).toMatchObject({
        de: 'draft',
        en: 'draft',
        es: 'draft',
      })
    })

    it('should block collection publish-all when draft saving is requested', async () => {
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
            title: 'English candidate',
          },
          draft: true,
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

      expect(latestDraft._status).toMatchObject({
        de: 'draft',
        en: 'draft',
        es: 'draft',
      })
    })

    it('should block global publish-all when status is draft without changing status', async () => {
      await seedPublishGlobal({
        de: '',
        en: 'English draft',
        es: 'Spanish required',
      })

      await expect(
        payload.updateGlobal({
          slug: publishGlobalSlug,
          data: {
            _status: 'draft',
            title: 'English candidate',
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

      expect(latestDraft._status).toMatchObject({
        de: 'draft',
        en: 'draft',
        es: 'draft',
      })
    })

    it('should block global publish-all when draft saving is requested', async () => {
      await seedPublishGlobal({
        de: '',
        en: 'English draft',
        es: 'Spanish required',
      })

      await expect(
        payload.updateGlobal({
          slug: publishGlobalSlug,
          data: {
            title: 'English candidate',
          },
          draft: true,
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

      expect(latestDraft._status).toMatchObject({
        de: 'draft',
        en: 'draft',
        es: 'draft',
      })
    })

    it('should block publish-all from a trashed source when status is omitted', async () => {
      const draft = await seedPublishCollection({
        de: '',
        deletedAt: new Date().toISOString(),
        en: 'English draft',
        es: 'Spanish required',
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: {
            title: 'English candidate',
          },
          locale: 'en',
          publishAllLocales: true,
          trash: true,
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
        trash: true,
      })

      expect(latestDraft.deletedAt).toBeTruthy()
      expect(latestDraft._status).toMatchObject({
        de: 'draft',
        en: 'draft',
        es: 'draft',
      })
    })

    it('should not apply flat localized object candidates to a required sibling locale', async () => {
      const omittedFields: PublishCollectionLocalizedField[] = [
        'localizedArray',
        'localizedBlocks',
        'localizedGroup',
        'localizedJSON',
        'localizedRichText',
        'localizedTab',
        'nested.localizedJSON',
      ]
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish required',
        omit: {
          es: omittedFields,
        },
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: {
            ...getPublishCollectionLocaleData({ title: 'English published' }),
            _status: 'published',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining(
            [
              'localizedArray',
              'localizedBlocks',
              'localizedGroup.value',
              'localizedJSON',
              'localizedRichText',
              'localizedTab.value',
              'nested.localizedJSON',
            ].map((path) =>
              expect.objectContaining({
                locale: 'es',
                path,
              }),
            ),
          ),
        },
      })
    })

    it('should not apply a flat localized JSON candidate to a required global sibling locale', async () => {
      await seedPublishGlobal({
        de: 'German optional',
        en: 'English draft',
        es: 'Spanish required',
        omitLocalizedJSON: {
          es: true,
        },
      })

      await expect(
        payload.updateGlobal({
          slug: publishGlobalSlug,
          data: {
            ...getPublishGlobalLocaleData({ title: 'English published' }),
            _status: 'published',
          },
          locale: 'en',
        }),
      ).rejects.toMatchObject({
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              locale: 'es',
              path: 'localizedJSON',
            }),
          ]),
        },
      })
    })

    it('should bypass required-locale publish validation when trashing a draft', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English draft',
        es: '',
      })
      const deletedAt = new Date().toISOString()

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: {
            deletedAt,
          },
          locale: 'en',
        }),
      ).resolves.toMatchObject({
        deletedAt,
      })
    })

    it('should bypass required-locale publish validation when restoring a trashed draft', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        deletedAt: new Date().toISOString(),
        en: 'English draft',
        es: '',
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: {
            deletedAt: null,
          },
          locale: 'en',
          trash: true,
        }),
      ).resolves.toMatchObject({
        deletedAt: null,
      })
    })

    it('should bypass required-locale publish validation for collection unpublish metadata', async () => {
      const draft = await seedPublishCollection({
        de: 'German optional',
        en: 'English draft',
        es: '',
      })

      await expect(
        payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: {
            _status: 'draft',
          },
          locale: 'en',
        }),
      ).resolves.toMatchObject({
        _status: 'draft',
      })
    })

    it('should bypass required-locale publish validation for global unpublish metadata', async () => {
      await seedPublishGlobal({
        de: 'German optional',
        en: 'English draft',
        es: '',
      })

      await expect(
        payload.updateGlobal({
          slug: publishGlobalSlug,
          data: {
            _status: 'draft',
          },
          locale: 'en',
        }),
      ).resolves.toMatchObject({
        _status: 'draft',
      })
    })

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

    describe('scheduled publish', () => {
      it('should cancel invalid collection publish-all jobs with safe locale details and no retry', async () => {
        const draft = await seedPublishCollection({
          de: 'German initially valid',
          en: 'private English scheduled value',
          es: 'Spanish required',
          fr: 'French optional',
        })
        const job = await payload.jobs.queue({
          input: {
            doc: {
              relationTo: publishCollectionSlug,
              value: draft.id.toString(),
            },
          },
          task: 'schedulePublish',
        })

        await payload.update({
          id: draft.id,
          collection: publishCollectionSlug,
          data: getPublishCollectionLocaleData({ title: '' }),
          draft: true,
          locale: 'de',
        })

        const firstRun = await payload.jobs.run({ silent: true })
        const failedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })
        const error = failedJob.error as { cancelled?: boolean; message?: string }

        expect(firstRun.jobStatus?.[job.id]?.status).toBe('error-reached-max-retries')
        expect(failedJob.hasError).toBe(true)
        expect(error.cancelled).toBe(true)
        expect(error.message).toContain('[de] title')
        expect(error.message).not.toContain('private English scheduled value')

        const secondRun = await payload.jobs.run({ silent: true })
        const jobAfterSecondRun = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })
        const latestDraft = await payload.findByID({
          id: draft.id,
          collection: publishCollectionSlug,
          draft: true,
          locale: 'all',
        })

        expect(secondRun.jobStatus).toBeUndefined()
        expect(jobAfterSecondRun.totalTried).toBe(failedJob.totalTried)
        expect(latestDraft._status).toMatchObject({
          de: 'draft',
          en: 'draft',
          es: 'draft',
        })
      })

      it('should publish every collection locale when a publish-all job is valid', async () => {
        const draft = await seedPublishCollection({
          de: 'German optional',
          en: 'English scheduled',
          es: 'Spanish required',
          fr: 'French optional',
        })
        const job = await payload.jobs.queue({
          input: {
            doc: {
              relationTo: publishCollectionSlug,
              value: draft.id.toString(),
            },
          },
          task: 'schedulePublish',
        })

        const result = await payload.jobs.run({ silent: true })
        const published = await payload.findByID({
          id: draft.id,
          collection: publishCollectionSlug,
          draft: true,
          locale: 'all',
        })
        const completedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })

        expect(result.jobStatus?.[job.id]?.status).toBe('success')
        expect(completedJob.hasError).toBe(false)
        expect(published._status).toMatchObject({
          de: 'published',
          en: 'published',
          es: 'published',
          fr: 'published',
        })
      })

      it('should validate the current and required collection locales but skip optional siblings', async () => {
        const draft = await seedPublishCollection({
          de: '',
          en: 'English scheduled',
          es: 'Spanish required',
          fr: '',
        })
        const job = await payload.jobs.queue({
          input: {
            doc: {
              relationTo: publishCollectionSlug,
              value: draft.id.toString(),
            },
            locale: 'en',
          },
          task: 'schedulePublish',
        })

        const result = await payload.jobs.run({ silent: true })
        const published = await payload.findByID({
          id: draft.id,
          collection: publishCollectionSlug,
          draft: true,
          locale: 'all',
        })

        expect(result.jobStatus?.[job.id]?.status).toBe('success')
        expect(published._status).toMatchObject({
          de: 'draft',
          en: 'published',
          es: 'draft',
          fr: 'draft',
        })
      })

      it('should cancel a current-locale collection job when a required locale is invalid', async () => {
        const draft = await seedPublishCollection({
          de: 'German optional',
          en: 'English scheduled',
          es: '',
        })
        const job = await payload.jobs.queue({
          input: {
            doc: {
              relationTo: publishCollectionSlug,
              value: draft.id.toString(),
            },
            locale: 'en',
          },
          task: 'schedulePublish',
        })

        await payload.jobs.run({ silent: true })

        const failedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })
        const error = failedJob.error as { cancelled?: boolean; message?: string }

        expect(error.cancelled).toBe(true)
        expect(error.message).toContain('[es] title')
      })

      it('should cancel invalid global publish-all jobs', async () => {
        await seedPublishGlobal({
          de: 'German initially valid',
          en: 'private English global value',
          es: 'Spanish required',
          fr: 'French optional',
        })
        const job = await payload.jobs.queue({
          input: {
            global: publishGlobalSlug,
          },
          task: 'schedulePublish',
        })

        await payload.updateGlobal({
          slug: publishGlobalSlug,
          data: getPublishGlobalLocaleData({ title: '' }),
          draft: true,
          locale: 'de',
        })

        await payload.jobs.run({ silent: true })

        const failedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })
        const error = failedJob.error as { cancelled?: boolean; message?: string }
        const latestDraft = await payload.findGlobal({
          slug: publishGlobalSlug,
          draft: true,
          locale: 'all',
        })

        expect(error.cancelled).toBe(true)
        expect(error.message).toContain('[de] title')
        expect(error.message).not.toContain('private English global value')
        expect(latestDraft._status).toMatchObject({
          de: 'draft',
          en: 'draft',
          es: 'draft',
        })
      })

      it('should publish every global locale when a publish-all job is valid', async () => {
        await seedPublishGlobal({
          de: 'German optional',
          en: 'English scheduled',
          es: 'Spanish required',
          fr: 'French optional',
        })
        const job = await payload.jobs.queue({
          input: {
            global: publishGlobalSlug,
          },
          task: 'schedulePublish',
        })

        const result = await payload.jobs.run({ silent: true })
        const published = await payload.findGlobal({
          slug: publishGlobalSlug,
          draft: true,
          locale: 'all',
        })
        const completedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })

        expect(result.jobStatus?.[job.id]?.status).toBe('success')
        expect(completedJob.hasError).toBe(false)
        expect(published._status).toMatchObject({
          de: 'published',
          en: 'published',
          es: 'published',
          fr: 'published',
        })
      })

      it('should not require validate access after scheduled global update access succeeds', async () => {
        const adminUser = await payload.create({
          collection: 'users',
          data: devUser,
        })

        await payload.updateGlobal({
          slug: validationDeniedGlobalSlug,
          data: {
            _status: 'draft',
            title: 'Scheduled with update access',
          },
          draft: true,
          locale: 'en',
        })

        const job = await payload.jobs.queue({
          input: {
            global: validationDeniedGlobalSlug,
            user: adminUser.id,
          },
          task: 'schedulePublish',
        })

        const result = await payload.jobs.run({ silent: true })

        expect(result.jobStatus?.[job.id]?.status).toBe('success')
        expect(scheduledValidationEvents).toEqual(['validate', 'validate', 'validate', 'validate'])
      })

      it('should check scheduled update access before running validation hooks', async () => {
        const revokedUser = await payload.create({
          collection: 'users',
          data: {
            ...devUser,
            email: 'revoked@example.com',
          },
        })

        await payload.updateGlobal({
          slug: validationDeniedGlobalSlug,
          data: {
            _status: 'draft',
            title: 'Must not be validated',
          },
          draft: true,
          locale: 'en',
        })

        const job = await payload.jobs.queue({
          input: {
            global: validationDeniedGlobalSlug,
            user: revokedUser.id,
          },
          task: 'schedulePublish',
        })

        const result = await payload.jobs.run({ silent: true })

        expect(result.jobStatus?.[job.id]?.status).toBe('error-reached-max-retries')
        expect(scheduledValidationEvents).toEqual([])
      })

      it('should validate the current and required global locales but skip optional siblings', async () => {
        await seedPublishGlobal({
          de: '',
          en: 'English scheduled',
          es: 'Spanish required',
          fr: '',
        })
        const job = await payload.jobs.queue({
          input: {
            global: publishGlobalSlug,
            locale: 'en',
          },
          task: 'schedulePublish',
        })

        const result = await payload.jobs.run({ silent: true })
        const published = await payload.findGlobal({
          slug: publishGlobalSlug,
          draft: true,
          locale: 'all',
        })

        expect(result.jobStatus?.[job.id]?.status).toBe('success')
        expect(published._status).toMatchObject({
          de: 'draft',
          en: 'published',
          es: 'draft',
          fr: 'draft',
        })
      })

      it('should cancel a current-locale global job when a required locale is invalid', async () => {
        await seedPublishGlobal({
          de: 'German optional',
          en: 'English scheduled',
          es: '',
        })
        const job = await payload.jobs.queue({
          input: {
            global: publishGlobalSlug,
            locale: 'en',
          },
          task: 'schedulePublish',
        })

        await payload.jobs.run({ silent: true })

        const failedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })
        const error = failedJob.error as { cancelled?: boolean; message?: string }

        expect(error.cancelled).toBe(true)
        expect(error.message).toContain('[es] title')
      })

      it('should cancel validation errors thrown by scheduled validation hooks without retrying', async () => {
        const draft = await seedPublishCollection({
          de: 'German optional',
          en: 'throw scheduled validation error',
          es: 'Spanish required',
        })
        const job = await payload.jobs.queue({
          input: {
            doc: {
              relationTo: publishCollectionSlug,
              value: draft.id.toString(),
            },
            locale: 'en',
          },
          task: 'schedulePublish',
        })

        const firstRun = await payload.jobs.run({ silent: true })
        const failedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })
        const error = failedJob.error as { cancelled?: boolean; message?: string }
        const latestDraft = await payload.findByID({
          id: draft.id,
          collection: publishCollectionSlug,
          draft: true,
          locale: 'all',
        })

        expect(firstRun.jobStatus?.[job.id]?.status).toBe('error-reached-max-retries')
        expect(error.cancelled).toBe(true)
        expect(error.message).toContain('[en] title: Scheduled validation hook rejected the title')
        expect(error.message).not.toContain('throw scheduled validation error')
        expect(latestDraft._status.en).toBe('draft')

        const secondRun = await payload.jobs.run({ silent: true })
        const jobAfterSecondRun = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })

        expect(secondRun.jobStatus).toBeUndefined()
        expect(jobAfterSecondRun.totalTried).toBe(failedJob.totalTried)
      })

      it('should preserve normal queue error handling for transient validation failures', async () => {
        const draft = await seedPublishCollection({
          de: 'German optional',
          en: 'throw transient scheduled error',
          es: 'Spanish required',
        })
        const job = await payload.jobs.queue({
          input: {
            doc: {
              relationTo: publishCollectionSlug,
              value: draft.id.toString(),
            },
            locale: 'en',
          },
          task: 'schedulePublish',
        })

        const result = await payload.jobs.run({ silent: true })
        const failedJob = await payload.findByID({
          id: job.id,
          collection: 'payload-jobs',
          depth: 0,
        })
        const error = failedJob.error as { cancelled?: boolean; message?: string }

        expect(result.jobStatus?.[job.id]?.status).toBe('error-reached-max-retries')
        expect(error.cancelled).toBe(false)
        expect(error.message).toContain('transient scheduled validation error')
      })
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
  writeAttempt:
    | 'create'
    | 'delete'
    | 'deleteMany'
    | 'restoreGlobalVersion'
    | 'restoreVersion'
    | 'update'
    | 'updateGlobal'
    | 'updateMany'
    | 'upload'
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
  })

  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: getPublishCollectionLocaleData({ omit: omit?.es, title: es }),
    draft: true,
    locale: 'es',
    trash: Boolean(deletedAt),
  })
  await payload.update({
    id: draft.id,
    collection: publishCollectionSlug,
    data: getPublishCollectionLocaleData({ omit: omit?.de, title: de }),
    draft: true,
    locale: 'de',
    trash: Boolean(deletedAt),
  })
  if (fr !== undefined) {
    await payload.update({
      id: draft.id,
      collection: publishCollectionSlug,
      data: getPublishCollectionLocaleData({ title: fr }),
      draft: true,
      locale: 'fr',
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
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({
      includeLocalizedJSON: !omitLocalizedJSON?.es,
      title: es,
    }),
    draft: true,
    locale: 'es',
  })
  await payload.updateGlobal({
    slug: publishGlobalSlug,
    data: getPublishGlobalLocaleData({
      includeLocalizedJSON: !omitLocalizedJSON?.de,
      title: de,
    }),
    draft: true,
    locale: 'de',
  })
  if (fr !== undefined) {
    await payload.updateGlobal({
      slug: publishGlobalSlug,
      data: getPublishGlobalLocaleData({
        title: fr,
      }),
      draft: true,
      locale: 'fr',
    })
  }
}

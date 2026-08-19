import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  GlobalConfig,
  PayloadRequest,
} from 'payload'

import path from 'path'
import { logoutOperation, refreshOperation, saveVersion, ValidationError } from 'payload'
import { fileURLToPath } from 'url'

// Direct internal import intentionally exercises the upload write guard.
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { uploadFiles } from '../../packages/payload/src/uploads/uploadFiles.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const validationCollectionSlug = 'validation-items'
export const validationFallbackCollectionSlug = 'validation-fallback-items'
export const validationGlobalSlug = 'validation-settings'
export const validationFallbackGlobalSlug = 'validation-fallback-settings'
export const validationDeniedGlobalSlug = 'validation-denied-settings'
export const validationDraftSourceGlobalSlug = 'validation-draft-source-settings'
export const validationAccessSourceGlobalSlug = 'validation-access-source-settings'
export const validationWhereCollectionSlug = 'validation-where-items'
export const validationWriteTargetGlobalSlug = 'validation-write-target-settings'
export const publishCollectionSlug = 'validation-publish-items'
export const publishGlobalSlug = 'validation-publish-settings'
export const writeTargetsSlug = 'validation-write-targets'
export const validationUploadsSlug = 'validation-uploads'
export const validationPublishUploadsSlug = 'validation-publish-uploads'
export const validationAdminCollectionSlug = 'validation-admin-items'
export const validationCustomButtonsCollectionSlug = 'validation-custom-buttons-items'
export const validationDeniedCollectionSlug = 'validation-denied-items'
export const validationNonLocalizedCollectionSlug = 'validation-non-localized-items'
export const validationUploadsDir = path.resolve(dirname, 'validation-uploads')
export const validationPublishUploadsDir = path.resolve(dirname, 'validation-publish-uploads')

type HookEvent = {
  context: Record<string, unknown>
  hook: string
  operation: string
  requestOperation: string | undefined
}

export const hookEvents: HookEvent[] = []
export const accessEvents: string[] = []
export const fallbackAccessEvents: {
  operation: string | undefined
  source: 'collection' | 'field' | 'global'
}[] = []
export const globalValidationSourceEvents: string[] = []
export const localeFilterOperationEvents: (string | undefined)[] = []
export const permissionOperationEvents: {
  entity: 'collection' | 'global'
  observedOperation: string | undefined
  operation: string
  source: 'entity' | 'field'
}[] = []
export const scheduledValidationEvents: string[] = []
export const isolationEvents: {
  candidateMarker: unknown
  contextMarker: unknown
  headerMarker: null | string
  locale: string | undefined
  queryMarker: unknown
  requestDataMarker: unknown
  responseHeaderMarker: null | string
  routeMarker: unknown
  source: 'collection' | 'global'
  userMarker: unknown
}[] = []
export const validationRuntimeIdentityEvents: {
  payload: PayloadRequest['payload']
  transactionID: PayloadRequest['transactionID']
}[] = []
const localePassRequests = new Set<PayloadRequest>()
export const localePassEvents: {
  localeAtEnd?: string
  localeAtStart: string | undefined
  operationAtEnd?: string
  operationAtStart: string | undefined
}[] = []
let activeLocalePasses = 0
let maximumActiveLocalePasses = 0

export function clearValidationEvents(): void {
  accessEvents.length = 0
  fallbackAccessEvents.length = 0
  globalValidationSourceEvents.length = 0
  hookEvents.length = 0
  isolationEvents.length = 0
  localeFilterOperationEvents.length = 0
  localePassEvents.length = 0
  localePassRequests.clear()
  activeLocalePasses = 0
  maximumActiveLocalePasses = 0
  permissionOperationEvents.length = 0
  scheduledValidationEvents.length = 0
  validationRuntimeIdentityEvents.length = 0
}

export function getLocalePassRequestCount(): number {
  return localePassRequests.size
}

export function getMaximumActiveLocalePasses(): number {
  return maximumActiveLocalePasses
}

function recordHook({ context, hook, operation, requestOperation }: HookEvent): void {
  hookEvents.push({
    context: { ...context },
    hook,
    operation,
    requestOperation,
  })
}

function getIsolationMarker(value: unknown): unknown {
  return (value as { isolation?: { marker?: unknown } } | null | undefined)?.isolation?.marker
}

function recordPermissionOperation({
  entity,
  operation,
  req,
  source,
}: {
  entity: 'collection' | 'global'
  operation: string
  req: PayloadRequest
  source: 'entity' | 'field'
}): boolean {
  permissionOperationEvents.push({
    entity,
    observedOperation: req.operation,
    operation,
    source,
  })

  return req.operation === operation
}

async function recordAndMutateIsolationState({
  data,
  req,
  source,
}: {
  data: unknown
  req: PayloadRequest
  source: 'collection' | 'global'
}): Promise<void> {
  if (req.context.trackMutableIsolation !== true) {
    return
  }

  isolationEvents.push({
    candidateMarker: getIsolationMarker(data),
    contextMarker: getIsolationMarker(req.context),
    headerMarker: req.headers.get('x-validation-isolation'),
    locale: req.locale,
    queryMarker: getIsolationMarker(req.query),
    requestDataMarker: getIsolationMarker(req.data),
    responseHeaderMarker: req.responseHeaders?.get('x-validation-isolation') ?? null,
    routeMarker: getIsolationMarker(req.routeParams),
    source,
    userMarker: getIsolationMarker(req.user),
  })
  validationRuntimeIdentityEvents.push({
    payload: req.payload,
    transactionID: req.transactionID,
  })

  if (req.locale === 'en') {
    ;(data as { isolation: { marker: string } }).isolation.marker = 'mutated'
    ;(req.context.isolation as { marker: string }).marker = 'mutated'
    ;(req.data!.isolation as { marker: string }).marker = 'mutated'
    req.headers.set('x-validation-isolation', 'mutated')
    ;(req.query.isolation as { marker: string }).marker = 'mutated'
    req.responseHeaders!.set('x-validation-isolation', 'mutated')
    ;(req.routeParams!.isolation as { marker: string }).marker = 'mutated'
    ;(req.user as unknown as { isolation: { marker: string } }).isolation.marker = 'mutated'

    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

const runWriteAttempt: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'validate') {
    return data
  }

  const targetID = data.targetID as string | undefined

  switch (data.writeAttempt) {
    case 'create':
      await req.payload.create({
        collection: writeTargetsSlug,
        data: { title: 'must not be created' },
        disableTransaction: true,
        req,
      })
      break

    case 'delete':
      await req.payload.delete({
        id: targetID!,
        collection: writeTargetsSlug,
        disableTransaction: true,
        req,
      })
      break

    case 'deleteMany':
      await req.payload.delete({
        collection: writeTargetsSlug,
        disableTransaction: true,
        req,
        where: {
          id: {
            equals: targetID!,
          },
        },
      })
      break

    case 'logout':
      await logoutOperation({
        collection: req.payload.collections['users']!,
        req,
      })
      break

    case 'refresh':
      await refreshOperation({
        collection: req.payload.collections['users']!,
        req,
      })
      break

    case 'resetPassword':
      await req.payload.resetPassword({
        collection: 'users',
        data: { password: 'must-not-be-set', token: 'any-token' },
        overrideAccess: true,
        req,
      })
      break

    case 'restoreGlobalVersion':
      await req.payload.restoreGlobalVersion({
        id: targetID!,
        slug: validationWriteTargetGlobalSlug,
        req,
      })
      break

    case 'restoreVersion':
      await req.payload.restoreVersion({
        id: targetID!,
        collection: writeTargetsSlug,
        disableTransaction: true,
        req,
      })
      break

    case 'update':
      await req.payload.update({
        id: targetID!,
        collection: writeTargetsSlug,
        data: { title: 'must not be updated' },
        disableTransaction: true,
        req,
      })
      break

    case 'updateGlobal':
      await req.payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'must not be updated',
        },
        req,
      })
      break

    case 'updateMany':
      await req.payload.update({
        collection: writeTargetsSlug,
        data: {
          title: 'must not be updated',
        },
        disableTransaction: true,
        req,
        where: {
          id: {
            equals: targetID!,
          },
        },
      })
      break

    case 'upload': {
      const fileData = Buffer.from('must not be uploaded')

      await uploadFiles(
        req.payload,
        [
          {
            buffer: fileData,
            path: path.join(validationUploadsDir, 'blocked.txt'),
          },
        ],
        req,
      )
      break
    }

    case 'verifyEmail':
      await req.payload.verifyEmail({
        collection: 'users',
        req,
        token: 'any-token',
      })
      break

    case 'version':
      await saveVersion({
        id: targetID,
        collection: req.payload.collections[writeTargetsSlug]!.config,
        docWithLocales: {
          id: targetID,
          title: 'must not create a version',
        },
        operation: 'update',
        payload: req.payload,
        req,
      })
      break
  }

  return data
}

const validationCollection: CollectionConfig = {
  slug: validationCollectionSlug,
  access: {
    create: ({ req }) => {
      recordPermissionOperation({
        entity: 'collection',
        operation: 'create',
        req,
        source: 'entity',
      })
      return true
    },
    delete: ({ req }) => {
      recordPermissionOperation({
        entity: 'collection',
        operation: 'delete',
        req,
        source: 'entity',
      })
      return true
    },
    read: ({ req }) => {
      recordPermissionOperation({ entity: 'collection', operation: 'read', req, source: 'entity' })
      return true
    },
    update: ({ req }) => {
      recordPermissionOperation({
        entity: 'collection',
        operation: 'update',
        req,
        source: 'entity',
      })
      return true
    },
    validate: async ({ data, req }) => {
      accessEvents.push('collection')
      const hasValidationOperation = recordPermissionOperation({
        entity: 'collection',
        operation: 'validate',
        req,
        source: 'entity',
      })
      await recordAndMutateIsolationState({ data, req, source: 'collection' })
      return (
        hasValidationOperation &&
        (req.payloadAPI === 'REST' || req.context.allowValidation === true)
      )
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ context, operation, req, value }) => {
            recordHook({
              context,
              hook: 'fieldBeforeChange',
              operation,
              requestOperation: req.operation,
            })
            return value
          },
        ],
        beforeValidate: [
          ({ context, operation, req, value }) => {
            recordHook({
              context,
              hook: 'fieldBeforeValidate',
              operation,
              requestOperation: req.operation,
            })
            return value
          },
        ],
      },
      localized: true,
      required: true,
      validate: (value, { operation, req }) => {
        recordHook({
          context: req.context,
          hook: 'fieldValidate',
          operation,
          requestOperation: req.operation,
        })
        return typeof value === 'string' && value.length > 0 ? true : 'Title is required'
      },
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'text',
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'location',
      type: 'point',
      validate: (value) =>
        value === undefined || (Array.isArray(value) && value.length === 2)
          ? true
          : 'Location must use the public point tuple representation',
    },
    {
      name: 'writeAttempt',
      type: 'select',
      options: [
        'create',
        'delete',
        'deleteMany',
        'logout',
        'refresh',
        'resetPassword',
        'restoreGlobalVersion',
        'restoreVersion',
        'update',
        'updateGlobal',
        'updateMany',
        'upload',
        'verifyEmail',
        'version',
      ],
    },
    {
      name: 'targetID',
      type: 'text',
    },
    {
      name: 'user',
      type: 'json',
    },
    {
      name: 'req',
      type: 'json',
    },
    {
      name: 'context',
      type: 'json',
    },
    {
      name: 'overrideAccess',
      type: 'checkbox',
    },
    {
      name: 'operation',
      type: 'text',
    },
    {
      name: 'permissionProbe',
      type: 'group',
      fields: [
        {
          name: 'nested',
          type: 'text',
          access: {
            create: ({ req }) => {
              recordPermissionOperation({
                entity: 'collection',
                operation: 'create',
                req,
                source: 'field',
              })
              return true
            },
            read: ({ req }) => {
              recordPermissionOperation({
                entity: 'collection',
                operation: 'read',
                req,
                source: 'field',
              })
              return true
            },
            update: ({ req }) => {
              recordPermissionOperation({
                entity: 'collection',
                operation: 'update',
                req,
                source: 'field',
              })
              return true
            },
            validate: ({ req }) =>
              recordPermissionOperation({
                entity: 'collection',
                operation: 'validate',
                req,
                source: 'field',
              }),
          },
        },
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'permissionProbeBlock',
              fields: [
                {
                  name: 'nested',
                  type: 'text',
                  access: {
                    validate: ({ req }) =>
                      recordPermissionOperation({
                        entity: 'collection',
                        operation: 'validate',
                        req,
                        source: 'field',
                      }),
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'collectionBeforeChange',
          operation,
          requestOperation: req.operation,
        })

        if (req.context.throwValidationHook === true) {
          throw new Error('collection validation hook failure')
        }

        return data
      },
      runWriteAttempt,
    ],
    beforeValidate: [
      async ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'collectionBeforeValidate',
          operation,
          requestOperation: req.operation,
        })

        if (req.context.trackLocalePasses === true) {
          const localeAtStart = req.locale
          const operationAtStart = req.operation

          localePassRequests.add(req)
          activeLocalePasses += 1
          maximumActiveLocalePasses = Math.max(maximumActiveLocalePasses, activeLocalePasses)
          const localePassEvent: (typeof localePassEvents)[number] = {
            localeAtStart,
            operationAtStart,
          }
          localePassEvents.push(localePassEvent)

          req.locale = `mutated-${localeAtStart}`
          req.operation = 'update'

          await new Promise((resolve) => setTimeout(resolve, 25))

          localePassEvent.localeAtEnd = req.locale
          localePassEvent.operationAtEnd = req.operation

          req.locale = localeAtStart
          req.operation = operationAtStart
          activeLocalePasses -= 1
        }

        return data
      },
    ],
  },
  versions: false,
}

const validationGlobal: GlobalConfig = {
  slug: validationGlobalSlug,
  access: {
    read: ({ req }) => {
      recordPermissionOperation({ entity: 'global', operation: 'read', req, source: 'entity' })
      return true
    },
    update: ({ req }) => {
      recordPermissionOperation({ entity: 'global', operation: 'update', req, source: 'entity' })
      return true
    },
    validate: async ({ data, req }) => {
      accessEvents.push('global')
      const hasValidationOperation = recordPermissionOperation({
        entity: 'global',
        operation: 'validate',
        req,
        source: 'entity',
      })
      await recordAndMutateIsolationState({ data, req, source: 'global' })
      return (
        hasValidationOperation &&
        (req.payloadAPI === 'REST' || req.context.allowValidation === true)
      )
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'point',
      validate: (value) =>
        value === undefined || (Array.isArray(value) && value.length === 2)
          ? true
          : 'Location must use the public point tuple representation',
    },
    {
      name: 'permissionProbe',
      type: 'group',
      fields: [
        {
          name: 'nested',
          type: 'text',
          access: {
            read: ({ req }) => {
              recordPermissionOperation({
                entity: 'global',
                operation: 'read',
                req,
                source: 'field',
              })
              return true
            },
            update: ({ req }) => {
              recordPermissionOperation({
                entity: 'global',
                operation: 'update',
                req,
                source: 'field',
              })
              return true
            },
            validate: ({ req }) =>
              recordPermissionOperation({
                entity: 'global',
                operation: 'validate',
                req,
                source: 'field',
              }),
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'globalBeforeChange',
          operation,
          requestOperation: req.operation,
        })

        if (req.context.throwValidationHook === true) {
          throw new Error('global validation hook failure')
        }

        return data
      },
    ],
    beforeValidate: [
      ({ context, data, operation, req }) => {
        recordHook({
          context,
          hook: 'globalBeforeValidate',
          operation,
          requestOperation: req.operation,
        })
        return data
      },
    ],
  },
  versions: false,
}

const validationFallbackCollection: CollectionConfig = {
  slug: validationFallbackCollectionSlug,
  access: {
    create: () => true,
    read: () => true,
    update: ({ req }) => {
      fallbackAccessEvents.push({
        operation: req.operation,
        source: 'collection',
      })

      if (req.operation === 'validate' && req.context.requireValidationUser === true) {
        return Boolean(req.user)
      }

      return req.operation !== 'validate'
        ? true
        : req.payloadAPI === 'REST' || req.context.allowUpdateFallback === true
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'updateProtected',
      type: 'text',
      access: {
        update: ({ req }) => {
          fallbackAccessEvents.push({
            operation: req.operation,
            source: 'field',
          })

          return req.context.allowFieldUpdateFallback === true
        },
      },
      validate: (value) =>
        value === undefined || value === 'valid' ? true : 'Update-protected field is invalid',
    },
    {
      name: 'explicitlyValidated',
      type: 'text',
      access: {
        update: () => false,
        validate: () => true,
      },
      validate: (value) =>
        value === undefined || value === 'valid' ? true : 'Explicitly validated field is invalid',
    },
  ],
}

const validationWhereCollection: CollectionConfig = {
  slug: validationWhereCollectionSlug,
  access: {
    create: () => true,
    read: () => true,
    update: ({ req }) => {
      fallbackAccessEvents.push({
        operation: req.operation,
        source: 'collection',
      })

      const validationScope = req.context.validationScope

      if (req.operation !== 'validate') {
        return true
      }

      return typeof validationScope === 'string'
        ? {
            scope: {
              equals: validationScope,
            },
          }
        : false
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'scope',
      type: 'text',
      required: true,
    },
  ],
}

const validationFallbackGlobal: GlobalConfig = {
  slug: validationFallbackGlobalSlug,
  access: {
    update: ({ req }) => {
      fallbackAccessEvents.push({
        operation: req.operation,
        source: 'global',
      })

      if (req.operation === 'validate' && req.context.requireValidationUser === true) {
        return Boolean(req.user)
      }

      return req.operation !== 'validate'
        ? true
        : req.payloadAPI === 'REST' || req.context.allowUpdateFallback === true
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'updateProtected',
      type: 'text',
      access: {
        update: ({ req }) => {
          fallbackAccessEvents.push({
            operation: req.operation,
            source: 'field',
          })

          return req.context.allowFieldUpdateFallback === true
        },
      },
      validate: (value) =>
        value === undefined || value === 'valid'
          ? true
          : 'Global update-protected field is invalid',
    },
  ],
}

const validationDeniedGlobal: GlobalConfig = {
  slug: validationDeniedGlobalSlug,
  access: {
    update: ({ req }) => req.user?.email !== 'revoked@example.com',
    validate: () => false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  hooks: {
    beforeValidate: [
      ({ operation }) => {
        if (operation === 'validate') {
          scheduledValidationEvents.push(operation)
        }
      },
    ],
  },
  versions: {
    drafts: {
      schedulePublish: true,
      validate: false,
    },
  },
}

const validationWriteTargetGlobal: GlobalConfig = {
  slug: validationWriteTargetGlobalSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: true,
}

const getValidationSourceAccess: NonNullable<GlobalConfig['access']>['validate'] = ({ req }) => {
  const validationScope = req.context.validationScope

  return typeof validationScope === 'string'
    ? {
        scope: {
          equals: validationScope,
        },
      }
    : false
}

const validationDraftSourceGlobal: GlobalConfig = {
  slug: validationDraftSourceGlobalSlug,
  access: {
    validate: getValidationSourceAccess,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'scope',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        globalValidationSourceEvents.push(validationDraftSourceGlobalSlug)
        return data
      },
    ],
  },
  versions: {
    drafts: {
      validate: false,
    },
  },
}

const validationAccessSourceGlobal: GlobalConfig = {
  slug: validationAccessSourceGlobalSlug,
  access: {
    validate: getValidationSourceAccess,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'scope',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        globalValidationSourceEvents.push(validationAccessSourceGlobalSlug)
        return data
      },
    ],
  },
  versions: {
    drafts: {
      validate: false,
    },
  },
}

const publishCollection: CollectionConfig = {
  slug: publishCollectionSlug,
  access: {
    update: () => true,
    validate: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      access: {
        validate: ({ req }) => req.context.denyPublishFieldValidation !== true,
      },
      localized: true,
      required: true,
    },
    {
      name: 'localizedGroup',
      type: 'group',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
      localized: true,
    },
    {
      name: 'localizedJSON',
      type: 'json',
      localized: true,
      required: true,
    },
    {
      name: 'localizedRichText',
      type: 'richText',
      localized: true,
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'localizedTab',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
          label: 'Localized tab',
          localized: true,
        },
      ],
    },
    {
      name: 'localizedArray',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
      localized: true,
      minRows: 1,
      required: true,
    },
    {
      name: 'localizedBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'validationBlock',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
      localized: true,
      minRows: 1,
      required: true,
    },
    {
      name: 'nested',
      type: 'group',
      fields: [
        {
          name: 'localizedJSON',
          type: 'json',
          localized: true,
          required: true,
        },
        {
          name: 'shared',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (data?._status === 'published' && data?.title === 'throw scheduled validation error') {
          throw new ValidationError(
            {
              errors: [
                {
                  locale: req.locale ?? undefined,
                  message: 'Scheduled validation hook rejected the title',
                  path: 'title',
                },
              ],
              req,
            },
            req.t,
          )
        }

        if (data?._status === 'published' && data?.title === 'throw transient scheduled error') {
          throw new Error('transient scheduled validation error')
        }

        return data
      },
    ],
  },
  trash: true,
  versions: {
    drafts: {
      schedulePublish: true,
      validate: false,
    },
  },
}

const publishGlobal: GlobalConfig = {
  slug: publishGlobalSlug,
  access: {
    validate: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'localizedJSON',
      type: 'json',
      localized: true,
      required: true,
    },
  ],
  versions: {
    drafts: {
      schedulePublish: true,
      validate: false,
    },
  },
}

const validationAdminCollection: CollectionConfig = {
  slug: validationAdminCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: {
      validate: false,
    },
  },
}

const validationCustomButtonsCollection: CollectionConfig = {
  slug: validationCustomButtonsCollectionSlug,
  admin: {
    components: {
      edit: {
        beforeDocumentControls: [
          '/components/CustomValidateAllLocalesButton/index.js#CustomValidateAllLocalesButton',
          '/components/CustomValidateOtherLocalesButtons/index.js#CustomValidateOtherLocalesButtons',
        ],
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: {
      validate: false,
    },
  },
}

const validationDeniedCollection: CollectionConfig = {
  slug: validationDeniedCollectionSlug,
  access: {
    create: () => true,
    validate: () => false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
  ],
  versions: {
    drafts: {
      validate: false,
    },
  },
}

const validationNonLocalizedCollection: CollectionConfig = {
  slug: validationNonLocalizedCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export default buildConfigWithDefaults({
  admin: {
    autoLogin: {
      email: devUser.email,
      password: devUser.password,
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    validationCollection,
    validationFallbackCollection,
    validationWhereCollection,
    publishCollection,
    validationAdminCollection,
    validationCustomButtonsCollection,
    validationDeniedCollection,
    validationNonLocalizedCollection,
    {
      slug: writeTargetsSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
      versions: true,
    },
    {
      slug: validationUploadsSlug,
      fields: [],
      upload: {
        staticDir: validationUploadsDir,
      },
      versions: false,
    },
    {
      slug: validationPublishUploadsSlug,
      access: {
        validate: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
        },
      ],
      upload: {
        imageSizes: [
          {
            name: 'thumbnail',
            height: 64,
            width: 64,
          },
        ],
        staticDir: validationPublishUploadsDir,
      },
      versions: {
        drafts: {
          validate: false,
        },
      },
    },
  ],
  globals: [
    validationGlobal,
    validationFallbackGlobal,
    validationDeniedGlobal,
    validationWriteTargetGlobal,
    validationDraftSourceGlobal,
    validationAccessSourceGlobal,
    publishGlobal,
  ],
  jobs: {
    deleteJobOnComplete: false,
  },
  localization: {
    defaultLocale: 'en',
    filterAvailableLocales: ({ locales, req }) => {
      localeFilterOperationEvents.push(req.operation)
      const availableLocaleCodes = req.context.availableLocaleCodes as string[] | undefined

      return availableLocaleCodes
        ? locales.filter(({ code }) => availableLocaleCodes.includes(code))
        : locales
    },
    locales: [
      {
        code: 'en',
        label: 'English',
      },
      {
        code: 'es',
        label: 'Spanish',
      },
      {
        code: 'de',
        fallbackLocale: 'en',
        label: 'German',
      },
      {
        code: 'fr',
        label: 'French',
      },
    ],
  },
  onInit: async (payload) => {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})

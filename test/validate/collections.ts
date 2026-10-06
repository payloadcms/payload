import type { Block, CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { createCreatedByField, defaultUserCollection, ValidationError } from 'payload'

import {
  accessEvents,
  fallbackAccessEvents,
  recordAndMutateIsolationState,
  recordGraphQLValidationTransaction,
  recordHook,
  recordPermissionOperation,
  trackLocalePass,
} from './events.js'
import {
  publishCollectionSlug,
  validateAfterReadPreviousValue,
  validationAuthCollectionSlug,
  validationCollectionSlug,
  validationCustomIDCollectionSlug,
  validationDeniedCollectionSlug,
  validationEmptyCollectionSlug,
  validationFallbackCollectionSlug,
  validationNonLocalizedCollectionSlug,
  validationUniqueCollectionSlug,
  validationUploadsDir,
  validationUploadsSlug,
  validationWhereCollectionSlug,
  writeTargetsSlug,
} from './shared.js'
import { runWriteAttempt } from './writeSafety.js'

// Exercises the operation value that Lexical's Blocks, Link, and Upload features pass down to
// their nested fields' own `validate` functions and `beforeChange` hooks. `validate` used to
// coerce anything other than `create`/`update` to `update`, so nested fields never saw
// `operation: 'validate'`; `beforeChange` already threaded it through correctly.
const nestedFieldValidateBlock: Block = {
  slug: 'nestedFieldValidateBlock',
  fields: [
    {
      name: 'value',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ context, operation, req, value }) => {
            recordHook({
              context,
              hook: 'nestedBlockFieldBeforeChange',
              operation,
              requestOperation: req.operation,
            })
            return value
          },
        ],
      },
      validate: (value, { operation, req }) => {
        recordHook({
          context: req.context,
          hook: 'nestedBlockFieldValidate',
          operation,
          requestOperation: req.operation,
        })
        return typeof value === 'string' && value.length > 0 ? true : 'Value is required'
      },
    },
  ],
}

const validationCollection: CollectionConfig = {
  slug: validationCollectionSlug,
  access: {
    create: ({ req }) => {
      recordPermissionOperation({ operation: 'create', req })
      return true
    },
    delete: ({ req }) => {
      recordPermissionOperation({ operation: 'delete', req })
      return true
    },
    read: ({ req }) => {
      recordPermissionOperation({ operation: 'read', req })
      return true
    },
    update: ({ req }) => {
      recordPermissionOperation({ operation: 'update', req })
      return true
    },
    validate: async ({ data, req }) => {
      accessEvents.push('collection')
      const hasValidationOperation = recordPermissionOperation({ operation: 'validate', req })
      await recordAndMutateIsolationState({ data, req, source: 'collection' })
      return hasValidationOperation && req.context.denyValidationAccess !== true
    },
  },
  authorship: false,
  dbName: 'validate_items',
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

            if (context.throwFieldValidationError === true) {
              throw new ValidationError(
                {
                  collection: validationCollectionSlug,
                  errors: [{ message: 'Collection field validation failure', path: 'title' }],
                  req,
                },
                req.t,
              )
            }

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
      name: 'blockRichText',
      type: 'richText',
      editor: lexicalEditor({
        features: [BlocksFeature({ blocks: [nestedFieldValidateBlock] })],
      }),
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'localeSensitiveValue',
      type: 'text',
      validate: (value, { req }) =>
        value && req.context.failNonLocalizedFieldForLocale === req.locale
          ? 'The shared value is invalid for this locale'
          : true,
    },
    {
      name: 'status',
      type: 'text',
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'transactionMarker',
      type: 'text',
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
      name: 'afterReadValue',
      type: 'text',
      hooks: {
        afterRead: [
          ({ value }) =>
            typeof value === 'string' && !value.startsWith('after-read:')
              ? `after-read:${value}`
              : value,
        ],
      },
      validate: validateAfterReadPreviousValue,
    },
    {
      name: 'hookReplacedBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'sharedValidationBlock',
          fields: [
            {
              name: 'value',
              type: 'text',
            },
          ],
        },
        {
          slug: 'localizedValidationBlock',
          fields: [
            {
              name: 'value',
              type: 'text',
              localized: true,
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'writeAttempt',
      type: 'select',
      options: [
        'create',
        'delete',
        'deleteMany',
        'forgotPassword',
        'jobsHandleSchedules',
        'jobsQueue',
        'login',
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
      name: 'emptyCollectionRelation',
      type: 'relationship',
      relationTo: validationEmptyCollectionSlug,
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

        if (req.context.throwValidationErrorHook === true) {
          throw new ValidationError(
            {
              collection: validationCollectionSlug,
              errors: [{ message: 'Collection hook validation failure', path: 'title' }],
              req,
            },
            req.t,
          )
        }

        if (req.context.throwMultipleValidationErrors === true) {
          throw new ValidationError(
            {
              collection: validationCollectionSlug,
              errors: [
                { message: 'Summary failed the first check', path: 'summary' },
                { message: 'Summary failed the second check', path: 'summary' },
              ],
              req,
            },
            req.t,
          )
        }

        if (operation === 'validate' && req.context.replaceSharedBlockWithLocalizedBlock === true) {
          return {
            ...data,
            hookReplacedBlocks: [
              {
                blockType: 'localizedValidationBlock',
                value: '',
              },
            ],
          }
        }

        return data
      },
      runWriteAttempt,
    ],
    beforeValidate: [
      async ({ context, data, operation, req }) => {
        recordGraphQLValidationTransaction({ data, req, source: 'collection' })
        recordHook({
          context,
          hook: 'collectionBeforeValidate',
          operation,
          requestOperation: req.operation,
        })

        await trackLocalePass({ req })

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
  hooks: {
    beforeValidate: [
      ({ context, operation, req }) => {
        recordHook({
          context,
          hook: 'whereCollectionBeforeValidate',
          operation,
          requestOperation: req.operation,
        })
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
  dbName: 'publish_items',
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
      name: 'nestedLocalizedArray',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          localized: true,
          required: true,
        },
      ],
      hooks: {
        beforeValidate: [
          ({ context, req, value }) => {
            if (context.throwStoredNestedLocalizedArrayValidationError === true) {
              throw new ValidationError(
                {
                  collection: publishCollectionSlug,
                  errors: [
                    {
                      message: 'Stored nested localized field validation failure',
                      path: 'nestedLocalizedArray.0.value',
                    },
                  ],
                  req,
                },
                req.t,
              )
            }

            return value
          },
        ],
      },
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
    createCreatedByField({
      overrides: {
        required: true,
      },
    }),
  ],
}

const validationAuthCollection: CollectionConfig = {
  slug: validationAuthCollectionSlug,
  auth: {
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: false,
      requireUsername: false,
    },
    useAPIKey: true,
  },
  fields: [],
}

const validationCustomIDCollection: CollectionConfig = {
  slug: validationCustomIDCollectionSlug,
  fields: [
    {
      name: 'id',
      type: 'text',
      validate: (value) =>
        value === 'candidate-custom-id' ? true : 'The custom ID does not match the candidate',
    },
  ],
  graphQL: {
    pluralName: 'ValidationCustomIDItems',
    singularName: 'ValidationCustomIDItem',
  },
  timestamps: false,
  versions: false,
}

const validationEmptyCollection: CollectionConfig = {
  slug: validationEmptyCollectionSlug,
  fields: [
    {
      name: 'relatedValidationItems',
      type: 'join',
      collection: validationCollectionSlug,
      on: 'emptyCollectionRelation',
    },
  ],
  graphQL: {
    pluralName: 'ValidationEmptyItems',
    singularName: 'ValidationEmptyItem',
  },
  timestamps: false,
  versions: false,
}

const validationUniqueCollection: CollectionConfig = {
  slug: validationUniqueCollectionSlug,
  fields: [
    {
      name: 'uniqueValue',
      type: 'text',
      hooks: {
        beforeChange: [({ value }) => (typeof value === 'string' ? value.trim() : value)],
      },
      unique: true,
    },
    {
      name: 'compoundScope',
      type: 'text',
    },
    {
      name: 'compoundValue',
      type: 'text',
    },
  ],
  indexes: [
    {
      fields: ['compoundScope', 'compoundValue'],
      unique: true,
    },
  ],
  trash: true,
  versions: false,
}

export const validationCollections: CollectionConfig[] = [
  validationCollection,
  validationFallbackCollection,
  validationWhereCollection,
  publishCollection,
  validationDeniedCollection,
  validationNonLocalizedCollection,
  defaultUserCollection,
  validationAuthCollection,
  validationCustomIDCollection,
  validationEmptyCollection,
  validationUniqueCollection,
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
]

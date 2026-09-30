import type { GlobalConfig } from 'payload'

import { ValidationError } from 'payload'

import {
  accessEvents,
  fallbackAccessEvents,
  globalValidationSourceEvents,
  recordAndMutateIsolationState,
  recordGraphQLValidationTransaction,
  recordHook,
  recordPermissionOperation,
  scheduledValidationEvents,
} from './events.js'
import {
  publishGlobalSlug,
  validateAfterReadPreviousValue,
  validationAccessSourceGlobalSlug,
  validationDeniedGlobalSlug,
  validationDraftSourceGlobalSlug,
  validationFallbackGlobalSlug,
  validationGlobalSlug,
  validationWriteTargetGlobalSlug,
} from './shared.js'

const validationGlobal: GlobalConfig = {
  slug: validationGlobalSlug,
  access: {
    read: ({ req }) => {
      recordPermissionOperation({ operation: 'read', req })
      return true
    },
    update: ({ req }) => {
      recordPermissionOperation({ operation: 'update', req })
      return true
    },
    validate: async ({ data, req }) => {
      accessEvents.push('global')
      const hasValidationOperation = recordPermissionOperation({ operation: 'validate', req })
      await recordAndMutateIsolationState({ data, req, source: 'global' })
      return hasValidationOperation && req.context.denyValidationAccess !== true
    },
  },
  authorship: false,
  dbName: 'validate',
  fields: [
    {
      name: 'title',
      type: 'text',
      hooks: {
        beforeValidate: [
          ({ context, req, value }) => {
            if (context.throwFieldValidationError === true) {
              throw new ValidationError(
                {
                  errors: [{ message: 'Global field validation failure', path: 'title' }],
                  global: validationGlobalSlug,
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
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'transactionMarker',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'nestedTitle',
          type: 'text',
          required: true,
        },
      ],
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

        if (req.context.throwValidationErrorHook === true) {
          throw new ValidationError(
            {
              errors: [{ message: 'Global hook validation failure', path: 'title' }],
              global: validationGlobalSlug,
              req,
            },
            req.t,
          )
        }

        return data
      },
    ],
    beforeValidate: [
      ({ context, data, operation, req }) => {
        recordGraphQLValidationTransaction({ data, req, source: 'global' })
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

const publishGlobal: GlobalConfig = {
  slug: publishGlobalSlug,
  access: {
    validate: () => true,
  },
  dbName: 'publish_global',
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
          slug: 'globalValidationBlock',
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
  versions: {
    drafts: {
      schedulePublish: true,
      validate: false,
    },
  },
}

export const validationGlobals: GlobalConfig[] = [
  validationGlobal,
  validationFallbackGlobal,
  validationDeniedGlobal,
  validationWriteTargetGlobal,
  validationDraftSourceGlobal,
  validationAccessSourceGlobal,
  publishGlobal,
]

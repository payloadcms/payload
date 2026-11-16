import type { GlobalConfig } from 'payload'

import {
  accessEvents,
  fallbackAccessEvents,
  globalValidationSourceEvents,
  recordAndMutateIsolationState,
  recordGraphQLValidationTransaction,
  recordPermissionOperation,
  scheduledValidationEvents,
} from './events.js'
import {
  defaultDraftPublishGlobalSlug,
  defaultDraftValidationBlockSlug,
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
    beforeValidate: [
      ({ data, req }) => {
        recordGraphQLValidationTransaction({ data, req, source: 'global' })
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

const defaultDraftPublishGlobal: GlobalConfig = {
  slug: defaultDraftPublishGlobalSlug,
  dbName: 'default_global',
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      blocks: [defaultDraftValidationBlockSlug],
      minRows: 1,
      required: true,
    },
  ],
  versions: {
    drafts: true,
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
  defaultDraftPublishGlobal,
]

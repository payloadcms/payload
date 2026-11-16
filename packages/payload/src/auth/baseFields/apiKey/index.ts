import type { Field } from '../../../fields/config/types.js'

import { fieldAffectsData } from '../../../fields/config/types.js'
import { canCreateOrUpdateAPIKey } from './canCreateOrUpdateAPIKey.js'
import { encryptAPIKey } from './encryptAPIKey.js'
import { omitAPIKeyIndex } from './omitAPIKeyIndex.js'
import { omitEncryptedAPIKey } from './omitEncryptedAPIKey.js'
import { setAPIKeyIndex } from './setAPIKeyIndex.js'

export { omitAPIKey } from './omitAPIKey.js'

export const apiKeyFields = [
  // The `enableAPIKey` field is for backward compatibility only and will be removed in v4.
  {
    name: 'enableAPIKey',
    type: 'checkbox',
    access: {
      create: canCreateOrUpdateAPIKey,
      update: canCreateOrUpdateAPIKey,
    },
    admin: {
      components: {
        Field: false,
      },
    },
    label: ({ t }) => t('authentication:enableAPIKey'),
  },
  {
    name: 'apiKey',
    type: 'text',
    access: {
      create: canCreateOrUpdateAPIKey,
      read: () => false,
      update: canCreateOrUpdateAPIKey,
    },
    admin: {
      components: {
        Field: false,
      },
    },
    hooks: {
      afterRead: [omitEncryptedAPIKey],
      beforeChange: [encryptAPIKey],
    },
    label: ({ t }) => t('authentication:apiKey'),
  },
  {
    name: 'apiKeyIndex',
    type: 'text',
    access: {
      create: canCreateOrUpdateAPIKey,
      read: () => false,
      update: canCreateOrUpdateAPIKey,
    },
    admin: {
      disabled: true,
    },
    hidden: true,
    hooks: {
      afterRead: [omitAPIKeyIndex],
      beforeValidate: [setAPIKeyIndex],
    },
  },
  {
    name: 'hasAPIKey',
    type: 'checkbox',
    access: {
      read: canCreateOrUpdateAPIKey,
    },
    admin: {
      components: {
        Field: false,
      },
    },
    virtual: true,
  },
] as Field[]

/** Builds API key fields and safely merges custom overrides. */
export const getAPIKeyFields = (fields: Field[]): Field[] => {
  const customAPIKeyField = fields.find(
    (field) => fieldAffectsData(field) && field.name === 'apiKey',
  )
  const customAccess =
    customAPIKeyField && 'access' in customAPIKeyField ? customAPIKeyField.access : undefined

  return apiKeyFields.map((field) => {
    if (field.type === 'checkbox' && field.name === 'hasAPIKey') {
      return {
        ...field,
        access: {
          ...field.access,
          read: customAccess?.update ?? canCreateOrUpdateAPIKey,
        },
      }
    }

    if (
      (field.type !== 'checkbox' && field.type !== 'text') ||
      !['apiKeyIndex', 'enableAPIKey'].includes(field.name)
    ) {
      return field
    }

    return {
      ...field,
      access: {
        ...field.access,
        create: customAccess?.create ?? canCreateOrUpdateAPIKey,
        update: customAccess?.update ?? canCreateOrUpdateAPIKey,
      },
    }
  })
}

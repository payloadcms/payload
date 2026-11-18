import type { Field, TextField } from '../../fields/config/types.js'

import { fieldAffectsData } from '../../fields/config/types.js'
import { canCreateOrUpdateAPIKey } from './apiKey/canCreateOrUpdateAPIKey.js'
import { encryptAPIKey } from './apiKey/encryptAPIKey.js'
import { omitAPIKeyIndex } from './apiKey/omitAPIKeyIndex.js'
import { omitEncryptedAPIKey } from './apiKey/omitEncryptedAPIKey.js'
import { setAPIKeyIndex } from './apiKey/setAPIKeyIndex.js'
import { setKeyLast4 } from './apiKey/setKeyLast4.js'

export { omitAPIKey } from './apiKey/omitAPIKey.js'

type APIKeyTextFieldOverride = Omit<
  Partial<TextField>,
  'hasMany' | 'maxRows' | 'minRows' | 'name' | 'type' | 'validate'
>

export const createAPIKeyFields = ({
  apiKeyField,
  apiKeyIndexField,
  apiKeyLast4Field,
}: {
  apiKeyField?: APIKeyTextFieldOverride
  apiKeyIndexField?: APIKeyTextFieldOverride
  apiKeyLast4Field?: APIKeyTextFieldOverride
} = {}): Field[] => {
  const customAccess = apiKeyField?.access

  return [
    {
      name: 'apiKey',
      type: 'text',
      ...apiKeyField,
      access: {
        create: canCreateOrUpdateAPIKey,
        ...apiKeyField?.access,
        read: () => false,
        update: apiKeyField?.access?.update ?? canCreateOrUpdateAPIKey,
      },
      admin: {
        components: {
          Field: false,
        },
        ...apiKeyField?.admin,
      },
      hooks: {
        ...apiKeyField?.hooks,
        afterRead: [omitEncryptedAPIKey, ...(apiKeyField?.hooks?.afterRead ?? [])],
        beforeChange: [encryptAPIKey, ...(apiKeyField?.hooks?.beforeChange ?? [])],
      },
      label: apiKeyField?.label ?? (({ t }) => t('authentication:apiKey')),
    },
    {
      name: 'apiKeyLast4',
      type: 'text',
      ...apiKeyLast4Field,
      access: {
        ...apiKeyLast4Field?.access,
        create: customAccess?.create ?? canCreateOrUpdateAPIKey,
        read: customAccess?.update ?? canCreateOrUpdateAPIKey,
        update: customAccess?.update ?? canCreateOrUpdateAPIKey,
      },
      admin: {
        components: {
          Field: false,
        },
        ...apiKeyLast4Field?.admin,
      },
      hooks: {
        ...apiKeyLast4Field?.hooks,
        beforeValidate: [setKeyLast4, ...(apiKeyLast4Field?.hooks?.beforeValidate ?? [])],
      },
    },
    {
      name: 'apiKeyIndex',
      type: 'text',
      ...apiKeyIndexField,
      access: {
        ...apiKeyIndexField?.access,
        create: customAccess?.create ?? canCreateOrUpdateAPIKey,
        read: () => false,
        update: customAccess?.update ?? canCreateOrUpdateAPIKey,
      },
      admin: {
        disabled: true,
        ...apiKeyIndexField?.admin,
      },
      hidden: apiKeyIndexField?.hidden ?? true,
      hooks: {
        ...apiKeyIndexField?.hooks,
        afterRead: [omitAPIKeyIndex, ...(apiKeyIndexField?.hooks?.afterRead ?? [])],
        beforeValidate: [setAPIKeyIndex, ...(apiKeyIndexField?.hooks?.beforeValidate ?? [])],
      },
    },
  ]
}

/** Builds API key fields and safely merges custom overrides. */
export const getAPIKeyFields = (fields: Field[]): Field[] => {
  const customAPIKeyField = fields.find(
    (field) => fieldAffectsData(field) && field.name === 'apiKey' && field.type === 'text',
  )

  return createAPIKeyFields({ apiKeyField: customAPIKeyField as TextField | undefined })
}

import type { CheckboxField, Field, TextField } from '../../../fields/config/types.js'

import { canReadAPIKey } from './canReadAPIKey.js'
import { canReadAPIKeyStatus } from './canReadAPIKeyStatus.js'
import { decryptKey } from './decryptKey.js'
import { encryptKey } from './encryptKey.js'
import { generateKey } from './generateKey.js'
import { generateKeyIndex } from './generateKeyIndex.js'

type APIKeyCheckboxFieldOverride = Omit<Partial<CheckboxField>, 'name' | 'type'>
type APIKeyTextFieldOverride = Omit<
  Partial<TextField>,
  'hasMany' | 'maxRows' | 'minRows' | 'name' | 'type' | 'validate'
>

export const createAPIKeyFields = ({
  apiKeyField,
  apiKeyIndexField,
  enableAPIKeyField,
  includeEnableAPIKey = true,
}: {
  apiKeyField?: APIKeyTextFieldOverride
  apiKeyIndexField?: APIKeyTextFieldOverride
  enableAPIKeyField?: APIKeyCheckboxFieldOverride
  includeEnableAPIKey?: boolean
} = {}): Field[] => {
  const fields: Field[] = []

  if (includeEnableAPIKey) {
    fields.push({
      name: 'enableAPIKey',
      type: 'checkbox',
      ...enableAPIKeyField,
      access: {
        read: canReadAPIKeyStatus,
        ...enableAPIKeyField?.access,
      },
      admin: {
        components: {
          Field: false,
        },
        ...enableAPIKeyField?.admin,
      },
      label: enableAPIKeyField?.label ?? (({ t }) => t('authentication:enableAPIKey')),
    })
  }

  fields.push(
    {
      name: 'apiKey',
      type: 'text',
      ...apiKeyField,
      access: {
        read: canReadAPIKey,
        ...apiKeyField?.access,
      },
      admin: {
        components: {
          Field: false,
        },
        ...apiKeyField?.admin,
      },
      hooks: {
        afterRead: [decryptKey],
        beforeChange: [encryptKey],
        beforeValidate: [generateKey],
        ...apiKeyField?.hooks,
      },
      label: apiKeyField?.label ?? (({ t }) => t('authentication:apiKey')),
    },
    {
      name: 'apiKeyIndex',
      type: 'text',
      ...apiKeyIndexField,
      admin: {
        disabled: true,
        ...apiKeyIndexField?.admin,
      },
      hidden: apiKeyIndexField?.hidden ?? true,
      hooks: {
        beforeValidate: [generateKeyIndex({ includeEnableAPIKey })],
        ...apiKeyIndexField?.hooks,
      },
    },
  )

  return fields
}

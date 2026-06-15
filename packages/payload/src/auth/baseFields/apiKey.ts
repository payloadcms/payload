import crypto from 'crypto'

import type { CheckboxField, Field, FieldHook, TextField } from '../../fields/config/types.js'

const encryptKey: FieldHook = ({ req, value }) =>
  value ? req.payload.encrypt(value as string) : null
const decryptKey: FieldHook = ({ req, value }) =>
  value ? req.payload.decrypt(value as string) : undefined

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
      admin: {
        components: {
          Field: false,
        },
        ...apiKeyField?.admin,
      },
      hooks: {
        afterRead: [decryptKey],
        beforeChange: [encryptKey],
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
        beforeValidate: [
          ({ data, req, value }) => {
            if (data?.apiKey === false || data?.apiKey === null || data?.apiKey === '') {
              return null
            }
            if (
              includeEnableAPIKey &&
              (data?.enableAPIKey === false || data?.enableAPIKey === null)
            ) {
              return null
            }
            if (data?.apiKey) {
              return crypto
                .createHmac('sha256', req.payload.secret)
                .update(data.apiKey as string)
                .digest('hex')
            }
            return value
          },
        ],
        ...apiKeyIndexField?.hooks,
      },
    },
  )

  return fields
}

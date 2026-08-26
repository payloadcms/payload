import crypto from 'crypto'

import type {
  CheckboxField,
  Field,
  FieldAccess,
  FieldHook,
  TextField,
} from '../../fields/config/types.js'

import { Forbidden } from '../../errors/Forbidden.js'
import { UnauthorizedError } from '../../errors/UnauthorizedError.js'
import { canAccessAdmin } from '../../utilities/canAccessAdmin.js'
import { generateAPIKey } from '../apiKeys/generateAPIKey.js'

const encryptKey: FieldHook = ({ req, value }) =>
  value ? req.payload.encrypt(value as string) : null

const createKeyIndex = ({ key, secret }: { key: string; secret: string }): string =>
  crypto.createHmac('sha256', secret).update(key).digest('hex')

const generateKey: FieldHook = async ({
  blockData,
  collection,
  data,
  field,
  operation,
  originalDoc,
  overrideAccess,
  previousSiblingDoc,
  previousValue,
  req,
  siblingData,
  value,
}) => {
  if (
    siblingData.enableAPIKey !== true ||
    (data?.apiKey !== null && data?.apiKey !== undefined && data.apiKey !== '')
  ) {
    return value
  }

  if (
    !overrideAccess &&
    (operation === 'create' || operation === 'update') &&
    'access' in field &&
    field.access?.[operation]
  ) {
    const hasAccess = await field.access[operation]({
      id: originalDoc?.id,
      blockData,
      collection: collection!,
      data,
      doc: originalDoc,
      req,
      siblingData,
    })

    if (!hasAccess) {
      throw new Forbidden(req.t)
    }
  }

  const isFirstEnable = operation === 'update' && previousSiblingDoc?.enableAPIKey !== true

  if (operation === 'create' || (isFirstEnable && !previousValue)) {
    const key = generateAPIKey()
    siblingData.apiKeyIndex = createKeyIndex({ key, secret: req.payload.secret })
    return key
  }

  if (isFirstEnable && previousValue) {
    siblingData.apiKeyIndex = createKeyIndex({
      key: previousValue as string,
      secret: req.payload.secret,
    })
  }

  return value
}

const decryptKey: FieldHook = ({ req, value }) => {
  if (!value) {
    return undefined
  }
  try {
    return req.payload.decrypt(value as string)
  } catch {
    // The value was encrypted under a secret no longer in the keyring (e.g. a
    // previousSecret was removed before rotateSecret re-keyed this row). Mask the
    // field (return null, since an undefined afterRead result is treated as "no
    // change" and would leak the ciphertext) rather than failing the whole
    // document read; API key auth is unaffected (it matches the apiKeyIndex), and
    // running rotateSecret restores the displayed value.
    return null
  }
}

const canReadAPIKey: FieldAccess = ({ id, collection, req }) =>
  Boolean(
    req.user &&
      id !== undefined &&
      String(req.user.id) === String(id) &&
      req.user.collection === collection?.slug,
  )

const canReadAPIKeyStatus: FieldAccess = async ({ req }) => {
  if (!req.user) {
    return false
  }

  try {
    await canAccessAdmin({ req })
    return true
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return false
    }

    throw error
  }
}

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
      access: {
        read: canReadAPIKeyStatus,
      },
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
      access: {
        read: canReadAPIKey,
      },
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
              return createKeyIndex({ key: data.apiKey as string, secret: req.payload.secret })
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

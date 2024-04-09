import crypto from 'crypto'

import type { Field, FieldHook } from '../../fields/config/types.js'

const encryptKey: FieldHook = ({ req, value }) =>
  value ? req.payload.encrypt(value as string) : null
const decryptKey: FieldHook = ({ req, value }) =>
  value ? req.payload.decrypt(value as string) : undefined

// eslint-disable-next-line no-restricted-exports
export default [
  {
    name: 'enableAPIKey',
    type: 'checkbox',
    admin: {
      components: {
        Field: () => null,
      },
    },
    defaultValue: false,
    label: ({ t }) => t('authentication:enableAPIKey'),
  },
  {
    name: 'apiKey',
    type: 'text',
    admin: {
      components: {
        Field: () => null,
      },
    },
    hooks: {
      afterRead: [decryptKey],
      beforeChange: [encryptKey],
    },
    label: ({ t }) => t('authentication:apiKey'),
  },
  {
    name: 'apiKeyIndex',
    type: 'text',
    admin: {
      disabled: true,
    },
    hidden: true,
    hooks: {
      beforeValidate: [
        ({ data, req, value }) => {
          if (data.apiKey) {
            return crypto
              .createHmac('sha1', req.payload.secret)
              .update(data.apiKey as string)
              .digest('hex')
          }
          if (data.enableAPIKey === false) {
            return null
          }
          return value
        },
      ],
    },
  },
] as Field[]

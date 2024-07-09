import type { Field } from '../fields/config/types.js'
import type { IncomingAuthType } from './types.js'

import { email } from '../fields/validations.js'
import { accountLockFields } from './baseFields/accountLock.js'
import { apiKeyFields } from './baseFields/apiKey.js'
import { verificationFields } from './baseFields/verification.js'

const emailField = ({ required }: { required: boolean }): Field => ({
  name: 'email',
  type: 'email',
  admin: {
    components: {
      Field: required ? () => null : undefined,
    },
  },
  label: ({ t }) => t('general:email'),
  required,
  unique: required,
  validate: email,
})

const usernameField: Field = {
  name: 'username',
  type: 'text',
  admin: {
    components: {
      Field: () => null,
    },
  },
  label: ({ t }) => t('authentication:username'),
  required: true,
  unique: true,
}

export const getBaseAuthFields = (authConfig: IncomingAuthType): Field[] => {
  const authFields: Field[] = []

  if (authConfig.useAPIKey) {
    authFields.concat(apiKeyFields)
  }

  if (!authConfig.disableLocalStrategy) {
    const emailFieldIndex = authFields.push(emailField({ required: true }))

    if (authConfig.loginWithUsername) {
      if (
        typeof authConfig.loginWithUsername === 'object' &&
        authConfig.loginWithUsername.requireEmail === false
      ) {
        authFields[emailFieldIndex] = emailField({ required: false })
      }

      authFields.push(usernameField)
    }

    if (authConfig.verify) {
      authFields.concat(verificationFields)
    }

    if (authConfig.maxLoginAttempts > 0) {
      authFields.concat(accountLockFields)
    }
  }

  return authFields
}

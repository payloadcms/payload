import type { Field } from '../fields/config/types.js'
import type { IncomingAuthType } from './types.js'

import { accountLockFields } from './baseFields/accountLock.js'
import { apiKeyFields } from './baseFields/apiKey.js'
import { baseAuthFields } from './baseFields/auth.js'
import { emailField } from './baseFields/email.js'
import { usernameField } from './baseFields/username.js'
import { verificationFields } from './baseFields/verification.js'

export const getBaseAuthFields = (authConfig: IncomingAuthType): Field[] => {
  const authFields: Field[] = []

  if (authConfig.useAPIKey) {
    authFields.push(...apiKeyFields)
  }

  if (!authConfig.disableLocalStrategy) {
    const emailFieldIndex = authFields.push(emailField({ required: true })) - 1

    if (authConfig.loginWithUsername) {
      if (
        typeof authConfig.loginWithUsername === 'object' &&
        authConfig.loginWithUsername.requireEmail === false
      ) {
        authFields[emailFieldIndex] = emailField({ required: false })
      }

      authFields.push(usernameField)
    }

    authFields.push(...baseAuthFields)

    if (authConfig.verify) {
      authFields.push(...verificationFields)
    }

    if (authConfig.maxLoginAttempts > 0) {
      authFields.push(...accountLockFields)
    }
  }

  return authFields
}

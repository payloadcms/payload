import type { Field, TextField } from '../fields/config/types.js'
import type { IncomingAuthType } from './types.js'

import { accountLockFields } from './baseFields/accountLock.js'
import { apiKeyFields } from './baseFields/apiKey.js'
import { baseAuthFields } from './baseFields/auth.js'
import { emailFieldConfig } from './baseFields/email.js'
import { usernameFieldConfig } from './baseFields/username.js'
import { verificationFields } from './baseFields/verification.js'

export const getBaseAuthFields = (authConfig: IncomingAuthType): Field[] => {
  const authFields: Field[] = []

  if (authConfig.useAPIKey) {
    authFields.push(...apiKeyFields)
  }

  if (
    !authConfig.disableLocalStrategy ||
    (typeof authConfig.disableLocalStrategy === 'object' &&
      authConfig.disableLocalStrategy.enableFields)
  ) {
    const emailField = { ...emailFieldConfig }
    let usernameField: TextField | undefined

    if (authConfig.loginWithUsername) {
      usernameField = { ...usernameFieldConfig }
      if (typeof authConfig.loginWithUsername === 'object') {
        if (authConfig.loginWithUsername.requireEmail === false) {
          emailField.required = false
        }
        if (authConfig.loginWithUsername.requireUsername === false) {
          usernameField.required = false
        }
        if (authConfig.loginWithUsername.allowEmailLogin === false) {
          emailField.unique = false
        }
      }
    }

    authFields.push(emailField)
    if (usernameField) {
      authFields.push(usernameField)
    }

    authFields.push(...baseAuthFields)

    if (authConfig.verify) {
      authFields.push(...verificationFields)
    }

    if (authConfig?.maxLoginAttempts && authConfig.maxLoginAttempts > 0) {
      authFields.push(...accountLockFields)
    }
  }

  return authFields
}

import type { IncomingAuthType, LoginWithUsernameOptions } from '../../auth/types.js'
import type { CollectionConfig } from './types.js'

import defaultAccess from '../../auth/defaultAccess.js'

/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export const defaults: Partial<CollectionConfig> = {
  access: {
    create: defaultAccess,
    delete: defaultAccess,
    read: defaultAccess,
    unlock: defaultAccess,
    update: defaultAccess,
  },
  admin: {
    components: {},
    custom: {},
    enableRichTextLink: true,
    enableRichTextRelationship: true,
    pagination: {
      defaultLimit: 10,
      limits: [5, 10, 25, 50, 100],
    },
    useAsTitle: 'id',
  },
  auth: false,
  custom: {},
  endpoints: [],
  fields: [],
  hooks: {
    afterChange: [],
    afterDelete: [],
    afterForgotPassword: [],
    afterLogin: [],
    afterLogout: [],
    afterMe: [],
    afterOperation: [],
    afterRead: [],
    afterRefresh: [],
    beforeChange: [],
    beforeDelete: [],
    beforeLogin: [],
    beforeOperation: [],
    beforeRead: [],
    beforeValidate: [],
    me: [],
    refresh: [],
  },
  indexes: [],
  timestamps: true,
  upload: false,
  versions: false,
}

export const addDefaultsToCollectionConfig = (collection: CollectionConfig): CollectionConfig => {
  collection.access = {
    create: defaultAccess,
    delete: defaultAccess,
    read: defaultAccess,
    unlock: defaultAccess,
    update: defaultAccess,
    ...(collection.access || {}),
  }

  collection.admin = {
    components: {},
    custom: {},
    enableRichTextLink: true,
    enableRichTextRelationship: true,
    useAsTitle: 'id',
    ...(collection.admin || {}),
    pagination: {
      defaultLimit: 10,
      limits: [5, 10, 25, 50, 100],
      ...(collection.admin?.pagination || {}),
    },
  }

  collection.auth = collection.auth ?? false
  collection.custom = collection.custom ?? {}
  collection.endpoints = collection.endpoints ?? []
  collection.fields = collection.fields ?? []

  collection.hooks = {
    afterChange: [],
    afterDelete: [],
    afterForgotPassword: [],
    afterLogin: [],
    afterLogout: [],
    afterMe: [],
    afterOperation: [],
    afterRead: [],
    afterRefresh: [],
    beforeChange: [],
    beforeDelete: [],
    beforeLogin: [],
    beforeOperation: [],
    beforeRead: [],
    beforeValidate: [],
    me: [],
    refresh: [],
    ...(collection.hooks || {}),
  }

  collection.timestamps = collection.timestamps ?? true
  collection.upload = collection.upload ?? false
  collection.versions = collection.versions ?? false

  collection.indexes = collection.indexes ?? []

  return collection
}

/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export const authDefaults: IncomingAuthType = {
  cookies: {
    sameSite: 'Lax',
    secure: false,
  },
  forgotPassword: {},
  lockTime: 600000, // 10 minutes
  loginWithUsername: false,
  maxLoginAttempts: 5,
  tokenExpiration: 7200,
  verify: false,
}

export const addDefaultsToAuthConfig = (auth: IncomingAuthType): IncomingAuthType => {
  auth.cookies = {
    sameSite: 'Lax',
    secure: false,
    ...(auth.cookies || {}),
  }

  auth.forgotPassword = auth.forgotPassword ?? {}
  auth.lockTime = auth.lockTime ?? 600000 // 10 minutes
  auth.loginWithUsername = auth.loginWithUsername ?? false
  auth.maxLoginAttempts = auth.maxLoginAttempts ?? 5
  auth.tokenExpiration = auth.tokenExpiration ?? 7200
  auth.verify = auth.verify ?? false
  auth.strategies = auth.strategies ?? []

  if (!auth.disableLocalStrategy && auth.verify === true) {
    auth.verify = {}
  }

  return auth
}

/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export const loginWithUsernameDefaults: LoginWithUsernameOptions = {
  allowEmailLogin: false,
  requireEmail: false,
  requireUsername: true,
}

export const addDefaultsToLoginWithUsernameConfig = (
  loginWithUsername: LoginWithUsernameOptions,
): LoginWithUsernameOptions =>
  ({
    allowEmailLogin: false,
    requireEmail: false,
    requireUsername: true,
    ...(loginWithUsername || {}),
  }) as LoginWithUsernameOptions

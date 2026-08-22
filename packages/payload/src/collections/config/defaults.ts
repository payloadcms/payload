import type { Auth, IncomingAuthType, LoginWithUsernameOptions } from '../../auth/types.js'
import type { CollectionConfig, SanitizedCollectionConfig } from './types.js'

import { defaultAccess } from '../../auth/defaultAccess.js'

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
    validate: defaultAccess,
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
    afterError: [],
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
  versions: true,
}

export const addDefaultsToCollectionConfig = (collection: CollectionConfig): CollectionConfig => {
  const access = collection.access

  collection.access = {
    ...access,
    create: access?.create ?? defaultAccess,
    delete: access?.delete ?? defaultAccess,
    read: access?.read ?? defaultAccess,
    unlock: access?.unlock ?? defaultAccess,
    update: access?.update ?? defaultAccess,
    validate: access?.validate ?? access?.update ?? defaultAccess,
  } satisfies SanitizedCollectionConfig['access']

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
  collection.hierarchy = collection.hierarchy ?? false

  const hooks = collection.hooks

  collection.hooks = {
    ...hooks,
    afterChange: hooks?.afterChange ?? [],
    afterDelete: hooks?.afterDelete ?? [],
    afterError: hooks?.afterError ?? [],
    afterForgotPassword: hooks?.afterForgotPassword ?? [],
    afterLogin: hooks?.afterLogin ?? [],
    afterLogout: hooks?.afterLogout ?? [],
    afterMe: hooks?.afterMe ?? [],
    afterOperation: hooks?.afterOperation ?? [],
    afterRead: hooks?.afterRead ?? [],
    afterRefresh: hooks?.afterRefresh ?? [],
    beforeChange: hooks?.beforeChange ?? [],
    beforeDelete: hooks?.beforeDelete ?? [],
    beforeLogin: hooks?.beforeLogin ?? [],
    beforeOperation: hooks?.beforeOperation ?? [],
    beforeRead: hooks?.beforeRead ?? [],
    beforeValidate: hooks?.beforeValidate ?? [],
    me: hooks?.me ?? [],
    refresh: hooks?.refresh ?? [],
  } satisfies SanitizedCollectionConfig['hooks']

  collection.timestamps = collection.timestamps ?? true
  collection.upload = collection.upload ?? false
  collection.versions = collection.versions ?? true

  collection.indexes = collection.indexes ?? []

  return collection
}

export const addDefaultsToAuthConfig = (auth: IncomingAuthType): Auth => {
  auth.cookies = {
    ...(auth.cookies || {}),
    sameSite: auth.cookies?.sameSite ?? 'Lax',
    secure: auth.cookies?.secure ?? false,
  } satisfies Auth['cookies']

  auth.depth = auth.depth ?? 0
  auth.forgotPassword = auth.forgotPassword ?? {}
  auth.lockTime = auth.lockTime ?? 600000 // 10 minutes
  auth.loginWithUsername = auth.loginWithUsername
    ? addDefaultsToLoginWithUsernameConfig(
        auth.loginWithUsername === true ? {} : auth.loginWithUsername,
      )
    : false
  auth.maxLoginAttempts = auth.maxLoginAttempts ?? 5
  auth.tokenExpiration = auth.tokenExpiration ?? 7200
  auth.useSessions = auth.useSessions ?? true
  auth.verify = auth.verify ?? false
  auth.strategies = auth.strategies ?? []

  if (!auth.disableLocalStrategy && auth.verify === true) {
    auth.verify = {}
  }

  return auth as Auth
}

/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export const loginWithUsernameDefaults: Required<LoginWithUsernameOptions> = {
  allowEmailLogin: false,
  requireEmail: false,
  requireUsername: true,
}

export const addDefaultsToLoginWithUsernameConfig = (
  loginWithUsername: LoginWithUsernameOptions,
): Required<LoginWithUsernameOptions> =>
  ({
    ...loginWithUsername,
    allowEmailLogin: loginWithUsername.allowEmailLogin ?? false,
    requireEmail: loginWithUsername.requireEmail ?? false,
    requireUsername: loginWithUsername.allowEmailLogin
      ? (loginWithUsername.requireUsername ?? true)
      : true,
  }) as Required<LoginWithUsernameOptions>

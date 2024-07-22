import type { LoginWithUsernameOptions } from '../../auth/types.js'

import defaultAccess from '../../auth/defaultAccess.js'

export const defaults = {
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
  timestamps: true,
  upload: false,
  versions: false,
}

export const authDefaults = {
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

export const loginWithUsernameDefaults: LoginWithUsernameOptions = {
  allowEmailLogin: false,
  requireEmail: false,
}

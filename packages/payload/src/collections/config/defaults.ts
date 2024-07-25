import defaultAccess from '../../auth/defaultAccess'

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
  maxLoginAttempts: 5,
  tokenExpiration: 7200,
  verify: false,
}

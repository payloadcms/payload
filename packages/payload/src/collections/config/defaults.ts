import defaultAccess from '../../auth/defaultAccess';

export const defaults = {
  access: {
    create: defaultAccess,
    read: defaultAccess,
    update: defaultAccess,
    delete: defaultAccess,
    unlock: defaultAccess,
  },
  timestamps: true,
  admin: {
    useAsTitle: 'id',
    components: {},
    enableRichTextLink: true,
    enableRichTextRelationship: true,
    pagination: {
      defaultLimit: 10,
      limits: [5, 10, 25, 50, 100],
    },
  },
  fields: [],
  hooks: {
    beforeOperation: [],
    beforeValidate: [],
    beforeChange: [],
    afterChange: [],
    beforeRead: [],
    afterRead: [],
    beforeDelete: [],
    afterDelete: [],
    beforeLogin: [],
    afterLogin: [],
    afterLogout: [],
    afterRefresh: [],
    afterMe: [],
    afterForgotPassword: [],
  },
  endpoints: [],
  auth: false,
  upload: false,
  versions: false,
  custom: {},
};

export const authDefaults = {
  tokenExpiration: 7200,
  maxLoginAttempts: 5,
  lockTime: 600000, // 10 minutes
  cookies: {
    secure: false,
    sameSite: 'Lax',
  },
  verify: false,
  forgotPassword: {},
};

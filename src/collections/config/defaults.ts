import { PayloadRequest } from '../../express/types/payloadRequest';

export const defaults = {
  access: {
    unlock: ({ req: { user } }: { req: PayloadRequest}): boolean => Boolean(user),
  },
  timestamps: true,
  admin: {
    useAsTitle: 'id',
    components: {},
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
    afterForgotPassword: [],
  },
  auth: false,
  upload: false,
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

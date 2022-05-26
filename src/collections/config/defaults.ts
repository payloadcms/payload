import defaultAccess from '../../auth/defaultAccess';
import { Endpoint } from '../../config/types';

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
    afterForgotPassword: [],
  },
  endpoints: [],
  auth: false,
  upload: false,
  versions: false,
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

export const collectionEndpointDefaults: Record<'verify' | 'unlock' | 'auth' | 'versions' | 'crud', Omit<Endpoint, 'handlers'>[]> = {
  verify: [
    {
      method: 'post',
      route: '/verify/:token',
    },
  ],
  unlock: [
    {
      method: 'post',
      route: '/unlock',
    },
  ],
  auth: [
    {
      method: 'get',
      route: '/init',
    },
    {
      method: 'post',
      route: '/login',
    },
    {
      method: 'post',
      route: '/logout',
    },
    {
      method: 'post',
      route: '/refresh-token',
    },
    {
      method: 'get',
      route: '/me',
    },
    {
      method: 'post',
      route: '/first-register',
    },
    {
      method: 'post',
      route: '/forgot-password',
    },
    {
      method: 'post',
      route: '/reset-password',
    },
  ],
  versions: [
    {
      method: 'get',
      route: '/versions',
    },
    {
      method: 'get',
      route: '/versions/:id',
    },
    {
      method: 'post',
      route: '/versions/:id',
    },
  ],
  crud: [
    {
      method: 'get',
      route: '/',
    },
    {
      method: 'post',
      route: '/',
    },
    {
      method: 'put',
      route: '/:id',
    },
    {
      method: 'get',
      route: '/:id',
    },
    {
      method: 'delete',
      route: '/:id',
    },
  ],
};

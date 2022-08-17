import { Response } from 'express';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import { openAccess } from '../helpers/configHelpers';
import { PayloadRequest } from '../../src/express/types';

export const collectionSlug = 'endpoints';
export const globalSlug = 'global-endpoints';

export const globalEndpoint = 'global';
export const applicationEndpoint = 'path';

export default buildConfig({
  collections: [
    {
      slug: collectionSlug,
      access: openAccess,
      endpoints: [
        {
          path: '/say-hello/joe-bloggs',
          method: 'get',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({ message: 'Hey Joey!' });
          },
        },
        {
          path: '/say-hello/:group/:name',
          method: 'get',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({ message: `Hello ${req.params.name} @ ${req.params.group}` });
          },
        },
        {
          path: '/say-hello/:name',
          method: 'get',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({ message: `Hello ${req.params.name}!` });
          },
        },
        {
          path: '/whoami',
          method: 'post',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({
              name: req.body.name,
              age: req.body.age,
            });
          },
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  globals: [
    {
      slug: globalSlug,
      endpoints: [{
        path: `/${globalEndpoint}`,
        method: 'post',
        handler: (req: PayloadRequest, res: Response): void => {
          res.json(req.body);
        },
      }],
      fields: [],
    },
  ],
  endpoints: [
    {
      path: applicationEndpoint,
      method: 'post',
      handler: (req: PayloadRequest, res: Response): void => {
        res.json(req.body);
      },
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });
  },
});

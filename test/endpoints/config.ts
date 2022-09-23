import express, { Response } from 'express';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import { openAccess } from '../helpers/configHelpers';
import { PayloadRequest } from '../../src/express/types';
import { Config } from '../../src/config/types';

export const collectionSlug = 'endpoints';
export const globalSlug = 'global-endpoints';

export const globalEndpoint = 'global';
export const applicationEndpoint = 'path';
export const rootEndpoint = 'root';

const MyConfig: Config = {
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
      path: `/${applicationEndpoint}`,
      method: 'post',
      handler: (req: PayloadRequest, res: Response): void => {
        res.json(req.body);
      },
    },
    {
      path: `/${applicationEndpoint}`,
      method: 'get',
      handler: (req: PayloadRequest, res: Response): void => {
        res.json({ message: 'Hello, world!' });
      },
    },
    {
      path: `/${rootEndpoint}`,
      method: 'get',
      root: true,
      handler: (req: PayloadRequest, res: Response): void => {
        res.json({ message: 'Hello, world!' });
      },
    },
    {
      path: `/${rootEndpoint}`,
      method: 'post',
      root: true,
      handler: [
        express.json({ type: 'application/json' }),
        (req: PayloadRequest, res: Response): void => {
          res.json(req.body);
        }
      ],
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
}

export default buildConfig(MyConfig);

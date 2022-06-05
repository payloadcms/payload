import { Response } from 'express';
import { CollectionConfig } from '../../src/collections/config/types';
import { PayloadRequest } from '../../src/express/types';

const Endpoints: CollectionConfig = {
  slug: 'endpoints',
  labels: {
    singular: 'Endpoint',
    plural: 'Endpoints',
  },
  admin: {
    useAsTitle: 'title',
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  endpoints: [
    {
      path: '/say-hello/joe-bloggs',
      method: 'get',
      handler: (req: PayloadRequest, res: Response): void => {
        res.json({ message: `Hey Joey! Welcome to ${req.payload.getAPIURL()}` });
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
};

export default Endpoints;

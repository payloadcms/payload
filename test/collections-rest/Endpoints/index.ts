import { Response } from 'express';
import { CollectionConfig } from '../../../src/collections/config/types';
import { openAccess } from '../../helpers/configHelpers';
import { PayloadRequest } from '../../../src/express/types';

export const endpointsSlug = 'endpoints';

const Endpoints: CollectionConfig = {
  slug: endpointsSlug,
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
};

export default Endpoints;

import { buildConfig } from '../buildConfig';
import { openAccess } from '../helpers/configHelpers';
import { Config } from '../../src/config/types';

const config: Config = {
  collections: [
    {
      slug: 'pages',
      access: openAccess,
      endpoints: [
        {
          path: '/hello',
          method: 'get',
          handler: (_, res): void => {
            res.json({ message: 'hi' });
          },
          custom: { examples: [{ type: 'response', value: { message: 'hi' } }] },
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: { description: 'The title of this page' },
        },
      ],
      custom: { externalLink: 'https://foo.bar' },
    },
  ],
  globals: [
    {
      slug: 'my-global',
      endpoints: [{
        path: '/greet',
        method: 'get',
        handler: (req, res): void => {
          const { name } = req.query;
          res.json({ message: `Hi ${name}!` });
        },
        custom: { params: [{ in: 'query', name: 'name', type: 'string' }] },
      }],
      fields: [{
        name: 'title',
        type: 'text',
        custom: { description: 'The title of my global' },
      },
      ],
      custom: { foo: 'bar' },
    },
  ],
  endpoints: [
    {
      path: '/config',
      method: 'get',
      root: true,
      handler: (req, res): void => {
        res.json(req.payload.config);
      },
      custom: { description: 'Get the sanitized payload config' },
    },
  ],
  custom: { name: 'Customer portal' },
};

export default buildConfig(config);

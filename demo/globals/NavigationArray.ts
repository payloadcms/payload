import { EndpointHandler } from '../../src/config/types';
import { GlobalConfig } from '../../src/globals/config/types';
import checkRole from '../access/checkRole';

const NavigationArray: GlobalConfig = {
  slug: 'navigation-array',
  access: {
    update: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    read: () => true,
  },
  admin: {
    description: 'A description for the editor',
  },
  endpoints: [
    {
      route: '/count',
      method: 'get',
      handlers: [
        ((req, res) => {
          return res.json({ message: `Count: ${Math.random()}` });
        }) as EndpointHandler,
      ],
    },
  ],
  fields: [
    {
      name: 'array',
      label: 'Array',
      type: 'array',
      localized: true,
      fields: [{
        name: 'text',
        label: 'Text',
        type: 'text',
      }, {
        name: 'textarea',
        label: 'Textarea',
        type: 'textarea',
      }],
    },
  ],
};

export default NavigationArray;

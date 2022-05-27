import { EndpointHandler } from '../../src/config/types';
import { GlobalConfig } from '../../src/globals/config/types';
import checkRole from '../access/checkRole';
import { NavigationArray as TNavigationArray } from '../payload-types';

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
        (async function getNavigationArrayCount(req, res) {
          const { array } = await this.findGlobal<TNavigationArray>({
            slug: 'navigation-array',
          });

          return res.json({ count: array.length });
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

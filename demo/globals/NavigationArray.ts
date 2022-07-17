import { Response } from 'express';
import { GlobalConfig } from '../../src/globals/config/types';
import checkRole from '../access/checkRole';
import { NavigationArray as TNavigationArray } from '../payload-types';
import { PayloadRequest } from '../../src/express/types';

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
      path: '/count',
      method: 'get',
      handler: async (req: PayloadRequest, res: Response): Promise<void> => {
        const { array } = await req.payload.findGlobal<TNavigationArray>({
          slug: 'navigation-array',
        });

        res.json({ count: array.length });
      },
    },
  ],
  fields: [
    {
      name: 'array',
      label: 'Array',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'text',
          label: 'Text',
          type: 'text',
        },
        {
          name: 'textarea',
          label: 'Textarea',
          type: 'textarea',
        },
      ],
    },
  ],
};

export default NavigationArray;

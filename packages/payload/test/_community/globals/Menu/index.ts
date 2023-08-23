import { GlobalConfig } from '../../../../src/globals/config/types';

export const menuSlug = 'menu';

export const MenuGlobal: GlobalConfig = {
  slug: menuSlug,
  fields: [
    {
      name: 'globalText',
      type: 'text',
    },
  ],
};

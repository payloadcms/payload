import type { GlobalConfig } from '../../../src/globals/config/types'

export const MainMenu: GlobalConfig = {
  slug: 'main-menu',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'nonLocalizedField',
      type: 'text',
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'localizedText',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
}

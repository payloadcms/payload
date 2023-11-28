import { lexicalEditor } from '../../../packages/richtext-lexical'

const Introduction: any = {
  slug: 'introduction',

  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'header',
          label: {
            vi: 'vi header',
            en: 'en header',
          },
          fields: [
            {
              name: 'rt1',
              type: 'richText',
            },
          ],
        },
        {
          name: 'experience',
          label: {
            en: 'en experience',
            vi: 'vi experience',
          },
          fields: [
            {
              name: 'rt2',
              type: 'richText',
            },
          ],
        },
      ],
    },
  ],
}

export default Introduction

import { CollectionConfig } from 'payload/types';
import { Content } from '../../blocks/Content';
import { hero } from '../../fields/hero';
import { slugField } from '../../fields/slug';
import { formatAppURL } from './formatAppURL';
import { revalidatePage } from './hooks/revalidatePage';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: ({ breadcrumbs }) => `${process.env.PAYLOAD_PUBLIC_SITE_URL}/api/preview?url=${formatAppURL(breadcrumbs)}`,
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      revalidatePage,
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            hero,
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              required: true,
              blocks: [
                Content,
              ],
            },
          ],
        },
      ],
    },
    slugField(),
  ],
};

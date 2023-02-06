import { CollectionConfig } from 'payload/types';
import richText from '../../fields/richText';
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
    richText(),
    slugField(),
  ],
};

import { CollectionConfig } from 'payload/types';
import { publishedOnly } from '../access/publishedOnly';
import { Content } from '../blocks/Content';
import { hero } from '../fields/hero';
import { slugField } from '../fields/slug';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOnly,
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

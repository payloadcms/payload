import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { getMetaDescriptionField } from '../../../../packages/plugin-seo/src/fields/MetaDescription'
import { getMetaTitleField } from '../../../../packages/plugin-seo/src/fields/MetaTitle'
// SEO fields
import { Overview } from '../../../../packages/plugin-seo/src/ui/Overview'
import { getPreviewField } from '../../../../packages/plugin-seo/src/ui/Preview'

const seoConfig = {
  generateTitle: ({ doc }) => `${doc?.title?.value} — Site name`,
  generateDescription: ({ doc }) => doc?.excerpt?.value,
  generateURL: ({ doc }) => `https://faefarm.com/news/${doc?.slug?.value}`,
  generateImage: ({ doc }) => doc?.featuredImage?.value,
}

const SeoPlugin: CollectionConfig = {
  slug: 'seo',
  fields: [
    {
      name: 'meta',
      label: 'SEO',
      type: 'group',
      fields: [
        {
          name: 'overview',
          label: 'Overview',
          type: 'ui',
          admin: {
            components: {
              Field: Overview,
            },
          },
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          localized: true,
          admin: {
            components: {
              Field: (props) => getMetaTitleField({ ...props, ...{ pluginConfig: seoConfig } }),
            },
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'description',
          localized: true,
          admin: {
            components: {
              Field: (props) =>
                getMetaDescriptionField({ ...props, ...{ pluginConfig: seoConfig } }),
            },
          },
        },
        {
          name: 'preview',
          label: 'Preview',
          type: 'ui',
          admin: {
            components: {
              Field: (props) => getPreviewField({ ...props, ...{ pluginConfig: seoConfig } }),
            },
          },
        },
        {
          name: 'publishedDate',
          type: 'date',
          admin: {
            position: 'sidebar',
          },
        },
      ],
    },
  ],
}
export default SeoPlugin

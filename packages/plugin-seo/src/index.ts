import { Config } from 'payload/config';
import { MetaDescription } from './fields/MetaDescription';
import { Overview } from './ui/Overview';
import { MetaTitle } from './fields/MetaTitle';
import { Preview } from './ui/Preview';
import { MetaImage } from './fields/MetaImage';
import { SEOConfig } from './types';
import { Field } from 'payload/dist/fields/config/types';

const seo = (seoConfig: SEOConfig) => (config: Config): Config => {
  const seoFields: Field[] = [
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
          admin: {
            components: {
              Field: MetaTitle,
            },
          },
        },
        {
          name: 'description',
          label: 'Meta Description',
          type: 'textarea',
          admin: {
            components: {
              Field: MetaDescription,
            },
          },
        },
        ...seoConfig?.uploadsCollection ? [{
          name: 'image',
          label: 'Meta Image',
          type: 'upload',
          relationTo: seoConfig?.uploadsCollection,
          admin: {
            description: 'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
            components: {
              Field: MetaImage,
            },
          },
        } as Field] : [],
        {
          name: 'preview',
          label: 'Preview',
          type: 'ui',
          admin: {
            components: {
              Field: Preview,
            },
          },
        },
      ]
    }
  ]

  return ({
    ...config,
    collections: config.collections?.map((collection) => {
      const { slug } = collection;
      const isEnabled = seoConfig?.collections?.includes(slug);

      if (isEnabled) {
        return ({
          ...collection,
          fields: [
            ...collection?.fields || [],
            ...seoFields,
          ],
        })
      }
      return collection;
    }) || []
  })
};

export default seo;

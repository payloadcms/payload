import { Config } from 'payload/config';
import { getMetaDescriptionField } from './fields/MetaDescription';
import { Overview } from './ui/Overview';
import { getMetaTitleField } from './fields/MetaTitle';
import { getPreviewField } from './ui/Preview';
import { getMetaImageField } from './fields/MetaImage';
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
          localized: true,
          admin: {
            components: {
              Field: (props) => getMetaTitleField({ ...props, seoConfig }),
            },
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          admin: {
            components: {
              Field: (props) => getMetaDescriptionField({ ...props, seoConfig }),
            },
          },
        },
        ...seoConfig?.uploadsCollection ? [{
          name: 'image',
          label: 'Meta Image',
          type: 'upload',
          localized: true,
          relationTo: seoConfig?.uploadsCollection,
          admin: {
            description: 'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
            components: {
              Field: (props) => getMetaImageField({ ...props, seoConfig }),
            },
          },
        } as Field] : [],
        {
          name: 'preview',
          label: 'Preview',
          type: 'ui',
          admin: {
            components: {
              Field: (props) => getPreviewField({ ...props, seoConfig }),
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

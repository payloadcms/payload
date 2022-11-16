import { Config } from 'payload/config';
import { getMetaDescriptionField } from './fields/MetaDescription';
import { Overview } from './ui/Overview';
import { getMetaTitleField } from './fields/MetaTitle';
import { getPreviewField } from './ui/Preview';
import { getMetaImageField } from './fields/MetaImage';
import { PluginConfig } from './types';
import { Field } from 'payload/dist/fields/config/types';

const seo = (pluginConfig: PluginConfig) => (config: Config): Config => {
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
              Field: (props) => getMetaTitleField({ ...props, pluginConfig }),
            },
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          admin: {
            components: {
              Field: (props) => getMetaDescriptionField({ ...props, pluginConfig }),
            },
          },
        },
        ...pluginConfig?.uploadsCollection ? [{
          name: 'image',
          label: 'Meta Image',
          type: 'upload',
          localized: true,
          relationTo: pluginConfig?.uploadsCollection,
          admin: {
            description: 'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
            components: {
              Field: (props) => getMetaImageField({ ...props, pluginConfig }),
            },
          },
        } as Field] : [],
        {
          name: 'preview',
          label: 'Preview',
          type: 'ui',
          admin: {
            components: {
              Field: (props) => getPreviewField({ ...props, pluginConfig }),
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
      const isEnabled = pluginConfig?.collections?.includes(slug);

      if (isEnabled) {
        return ({
          ...collection,
          fields: (pluginConfig?.tabbedUI ? [
            {
              type: 'tabs', tabs: [
                { label: collection?.labels?.singular || 'Content', fields: [...(collection?.fields || [])] },
                { label: 'SEO', fields: [...seoFields] },
              ]
            },
          ] : [
            ...collection?.fields || [],
            ...seoFields,
          ]),
        })
      }
      return collection;
    }) || [],
    globals: config.globals?.map((global) => {
      const { slug } = global;
      const isEnabled = pluginConfig?.globals?.includes(slug);

      if (isEnabled) {
        return ({
          ...global,
          fields: (pluginConfig?.tabbedUI ? [
            {
              type: 'tabs', tabs: [
                { label: global?.label || 'Content', fields: [...(global?.fields || [])] },
                { label: 'SEO', fields: [...seoFields] },
              ]
            },
          ] : [
            ...global?.fields || [],
            ...seoFields,
          ]),
        })
      }
      return global;
    }) || []
  })
};

export default seo;

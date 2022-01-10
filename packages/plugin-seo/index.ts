import { Config } from 'payload/config';
import { CollectionConfig } from 'payload/dist/collections/config/types';
import { MetaDescription } from './fields/MetaDescription';
import { Overview } from './ui/Overview';
import { MetaTitle } from './fields/MetaTitle';
import { Preview } from './ui/Preview';
import { MetaImage } from './fields/MetaImage';

type Options = {
  collections?: string[]
}

const seo = (options: Options) => (config: Config): Config => ({
  ...config,
  collections: config.collections.map((collection) => {
    const { slug } = collection;
    const addMeta = options?.collections?.includes(slug);

    return ({
      ...collection,
      fields: [
        ...collection.fields,
        ...addMeta ? [{
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
              label: 'Meta Title',
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
            {
              name: 'image',
              label: 'Meta Image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
                components: {
                  Field: MetaImage,
                },
              },
            },
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
          ],
        }] : [],
      ],
    }) as CollectionConfig;
  }),
});

export default seo;

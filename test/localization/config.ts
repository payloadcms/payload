import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import { LocalizedPost } from './payload-types';
import {
  defaultLocale,
  englishTitle,
  relationEnglishTitle,
  relationEnglishTitle2,
  relationSpanishTitle,
  relationSpanishTitle2,
  spanishLocale,
  spanishTitle,
} from './shared';

export type LocalizedPostAllLocale = LocalizedPost & {
  title: {
    en?: string;
    es?: string;
  };
};

export const slug = 'localized-posts';
export const withLocalizedRelSlug = 'with-localized-relationship';

export const withRequiredLocalizedFields = 'localized-required';

const openAccess = {
  read: () => true,
  create: () => true,
  delete: () => true,
  update: () => true,
};

export default buildConfig({
  localization: {
    locales: [defaultLocale, spanishLocale],
    defaultLocale,
  },
  collections: [
    {
      slug,
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
    {
      slug: withRequiredLocalizedFields,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'layout',
          type: 'blocks',
          required: true,
          localized: true,
          blocks: [
            {
              slug: 'text',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
            {
              slug: 'number',
              fields: [
                {
                  name: 'number',
                  type: 'number',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: withLocalizedRelSlug,
      access: openAccess,
      fields: [
        // Relationship
        {
          name: 'localizedRelationship',
          type: 'relationship',
          relationTo: slug,
        },
        // Relation hasMany
        {
          name: 'localizedRelationHasManyField',
          type: 'relationship',
          relationTo: slug,
          hasMany: true,
        },
        // Relation multiple relationTo
        {
          name: 'localizedRelationMultiRelationTo',
          type: 'relationship',
          relationTo: [slug, 'dummy'],
        },
        // Relation multiple relationTo hasMany
        {
          name: 'localizedRelationMultiRelationToHasMany',
          type: 'relationship',
          relationTo: [slug, 'dummy'],
          hasMany: true,
        },
      ],
    },
    {
      slug: 'dummy',
      access: openAccess,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    const collection = slug;

    await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    });

    const localizedPost = await payload.create<LocalizedPost>({
      collection,
      data: {
        title: englishTitle,
      },
    });
    await payload.update<LocalizedPost>({
      collection,
      id: localizedPost.id,
      locale: spanishLocale,
      data: {
        title: spanishTitle,
      },
    });

    const localizedRelation = await payload.create<LocalizedPost>({
      collection,
      data: {
        title: relationEnglishTitle,
      },
    });
    await payload.update<LocalizedPost>({
      collection,
      id: localizedPost.id,
      locale: spanishLocale,
      data: {
        title: relationSpanishTitle,
      },
    });

    const localizedRelation2 = await payload.create<LocalizedPost>({
      collection,
      data: {
        title: relationEnglishTitle2,
      },
    });
    await payload.update<LocalizedPost>({
      collection,
      id: localizedPost.id,
      locale: spanishLocale,
      data: {
        title: relationSpanishTitle2,
      },
    });

    await payload.create({
      collection: withLocalizedRelSlug,
      data: {
        localizedRelationship: localizedRelation.id,
        localizedRelationHasManyField: [localizedRelation.id, localizedRelation2.id],
        localizedRelationMultiRelationTo: { relationTo: collection, value: localizedRelation.id },
        localizedRelationMultiRelationToHasMany: [
          { relationTo: slug, value: localizedRelation.id },
          { relationTo: slug, value: localizedRelation2.id },
        ],
      },
    });
  },
});

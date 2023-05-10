import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import { ArrayCollection } from './collections/Array';
import { LocalizedPost, RelationshipLocalized } from './payload-types';
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

export const localizedPostsSlug = 'localized-posts';
export const withLocalizedRelSlug = 'with-localized-relationship';
export const relationshipLocalizedSlug = 'relationship-localized';
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
    fallback: true,
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [
        {
          name: 'relation',
          type: 'relationship',
          relationTo: localizedPostsSlug,
        },
      ],
    },
    {
      slug: localizedPostsSlug,
      access: openAccess,
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          index: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
    ArrayCollection,
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
          relationTo: localizedPostsSlug,
        },
        // Relation hasMany
        {
          name: 'localizedRelationHasManyField',
          type: 'relationship',
          relationTo: localizedPostsSlug,
          hasMany: true,
        },
        // Relation multiple relationTo
        {
          name: 'localizedRelationMultiRelationTo',
          type: 'relationship',
          relationTo: [localizedPostsSlug, 'dummy'],
        },
        // Relation multiple relationTo hasMany
        {
          name: 'localizedRelationMultiRelationToHasMany',
          type: 'relationship',
          relationTo: [localizedPostsSlug, 'dummy'],
          hasMany: true,
        },
      ],
    },
    {
      slug: relationshipLocalizedSlug,
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: localizedPostsSlug,
          localized: true,
        },
        {
          name: 'relationshipHasMany',
          type: 'relationship',
          relationTo: localizedPostsSlug,
          hasMany: true,
          localized: true,
        },
        {
          name: 'relationMultiRelationTo',
          type: 'relationship',
          relationTo: [localizedPostsSlug, 'dummy'],
          localized: true,
        },
        {
          name: 'relationMultiRelationToHasMany',
          type: 'relationship',
          relationTo: [localizedPostsSlug, 'dummy'],
          hasMany: true,
          localized: true,
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
  globals: [
    {
      slug: 'global-array',
      fields: [
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
  onInit: async (payload) => {
    const collection = localizedPostsSlug;

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

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
        relation: localizedPost.id,
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

    await payload.create<RelationshipLocalized>({
      collection: withLocalizedRelSlug,
      data: {
        relationship: localizedRelation.id,
        localizedRelationHasManyField: [localizedRelation.id, localizedRelation2.id],
        localizedRelationMultiRelationTo: { relationTo: collection, value: localizedRelation.id },
        localizedRelationMultiRelationToHasMany: [
          { relationTo: localizedPostsSlug, value: localizedRelation.id },
          { relationTo: localizedPostsSlug, value: localizedRelation2.id },
        ],
      },
    });
    await payload.create({
      collection: relationshipLocalizedSlug,
      locale: 'en',
      data: {
        relationship: localizedRelation.id,
        relationshipHasMany: [localizedRelation.id, localizedRelation2.id],
        relationMultiRelationTo: { relationTo: collection, value: localizedRelation.id },
        relationMultiRelationToHasMany: [
          { relationTo: localizedPostsSlug, value: localizedRelation.id },
          { relationTo: localizedPostsSlug, value: localizedRelation2.id },
        ],
      },
    });

    const globalArray = await payload.updateGlobal({
      slug: 'global-array',
      data: {
        array: [
          {
            text: 'test en 1',
          },
          {
            text: 'test en 2',
          },
        ],
      },
    });

    await payload.updateGlobal({
      slug: 'global-array',
      locale: 'es',
      data: {
        array: globalArray.array.map((row, i) => ({
          ...row,
          text: `test es ${i + 1}`,
        })),
      },
    });
  },
});

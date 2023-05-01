import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import { FieldAccess } from '../../src/fields/config/types';
import { firstArrayText, secondArrayText } from './shared';

export const slug = 'posts';
export const unrestrictedSlug = 'unrestricted';
export const readOnlySlug = 'read-only-collection';

export const userRestrictedSlug = 'user-restricted';
export const restrictedSlug = 'restricted';
export const restrictedVersionsSlug = 'restricted-versions';
export const siblingDataSlug = 'sibling-data';
export const relyOnRequestHeadersSlug = 'rely-on-request-headers';
export const docLevelAccessSlug = 'doc-level-access';
export const hiddenFieldsSlug = 'hidden-fields';

export const hiddenAccessSlug = 'hidden-access';

const openAccess = {
  create: () => true,
  read: () => true,
  update: () => true,
  delete: () => true,
};

const PublicReadabilityAccess: FieldAccess = ({ req: { user }, siblingData }) => {
  if (user) return true;
  if (siblingData?.allowPublicReadability) return true;

  return false;
};

export const requestHeaders = { authorization: 'Bearer testBearerToken' };
const UseRequestHeadersAccess: FieldAccess = ({ req: { headers } }) => {
  return !!headers && headers.authorization === requestHeaders.authorization;
};

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      access: {
        // admin: () => true,
        admin: async () => new Promise((resolve) => {
          // Simulate a request to an external service to determine access, i.e. another instance of Payload
          setTimeout(resolve, 50, true); // set to 'true' or 'false' here to simulate the response
        }),
      },
      fields: [],
    },
    {
      slug,
      access: {
        ...openAccess,
        update: () => false,
      },
      fields: [
        {
          name: 'restrictedField',
          type: 'text',
          access: {
            read: () => false,
            update: () => false,
          },
        },
        {
          type: 'group',
          name: 'group',
          fields: [
            {
              name: 'restrictedGroupText',
              type: 'text',
              access: {
                read: () => false,
                update: () => false,
                create: () => false,
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'restrictedRowText',
              type: 'text',
              access: {
                read: () => false,
                update: () => false,
                create: () => false,
              },
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Access',
          fields: [
            {
              name: 'restrictedCollapsibleText',
              type: 'text',
              access: {
                read: () => false,
                update: () => false,
                create: () => false,
              },
            },
          ],
        },
      ],
    },
    {
      slug: unrestrictedSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'userRestrictedDocs',
          type: 'relationship',
          relationTo: userRestrictedSlug,
          hasMany: true,
        },
      ],
    },
    {
      slug: restrictedSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
        delete: () => false,
      },
    },
    {
      slug: readOnlySlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => false,
        read: () => true,
        update: () => false,
        delete: () => false,
      },
    },
    {
      slug: userRestrictedSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => true,
        read: () => true,
        update: ({ req }) => ({
          name: {
            equals: req.user?.email,
          },
        }),
        delete: () => false,
      },
    },
    {
      slug: restrictedVersionsSlug,
      versions: true,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'hidden',
          type: 'checkbox',
          hidden: true,
        },
      ],
      access: {
        read: ({ req: { user } }) => {
          if (user) return true;

          return {
            hidden: {
              not_equals: true,
            },
          };
        },
        readVersions: ({ req: { user } }) => {
          if (user) return true;

          return {
            'version.hidden': {
              not_equals: true,
            },
          };
        },
      },
    },
    {
      slug: siblingDataSlug,
      access: openAccess,
      fields: [
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'allowPublicReadability',
                  label: 'Allow Public Readability',
                  type: 'checkbox',
                },
                {
                  name: 'text',
                  type: 'text',
                  access: {
                    read: PublicReadabilityAccess,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: relyOnRequestHeadersSlug,
      access: {
        create: UseRequestHeadersAccess,
        read: UseRequestHeadersAccess,
        update: UseRequestHeadersAccess,
        delete: UseRequestHeadersAccess,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: docLevelAccessSlug,
      labels: {
        singular: 'Doc Level Access',
        plural: 'Doc Level Access',
      },
      access: {
        delete: () => ({
          and: [
            {
              approvedForRemoval: {
                equals: true,
              },
            },
          ],
        }),
      },
      fields: [
        {
          name: 'approvedForRemoval',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'approvedTitle',
          type: 'text',
          localized: true,
          access: {
            update: (args) => {
              if (args?.doc?.lockTitle) {
                return false;
              }
              return true;
            },
          },
        },
        {
          name: 'lockTitle',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      slug: hiddenFieldsSlug,
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'partiallyHiddenGroup',
          type: 'group',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
            {
              name: 'value',
              type: 'text',
              hidden: true,
            },
          ],
        },
        {
          name: 'partiallyHiddenArray',
          type: 'array',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
            {
              name: 'value',
              type: 'text',
              hidden: true,
            },
          ],
        },
        {
          name: 'hidden',
          type: 'checkbox',
          hidden: true,
        },
      ],
    },
    {
      slug: hiddenAccessSlug,
      access: {
        read: ({ req: { user } }) => {
          if (user) return true;

          return {
            hidden: {
              not_equals: true,
            },
          };
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'hidden',
          type: 'checkbox',
          hidden: true,
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

    await payload.create({
      collection: slug,
      data: {
        restrictedField: 'restricted',
      },
    });

    await payload.create({
      collection: readOnlySlug,
      data: {
        name: 'read-only',
      },
    });

    await payload.create({
      collection: restrictedVersionsSlug,
      data: {
        name: 'versioned',
      },
    });

    await payload.create({
      collection: siblingDataSlug,
      data: {
        array: [
          {
            text: firstArrayText,
            allowPublicReadability: true,
          },
          {
            text: secondArrayText,
            allowPublicReadability: false,
          },
        ],
      },
    });
  },
});

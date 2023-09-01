import path from 'path';

import { mapAsync } from '../../src/utilities/mapAsync';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { devUser } from '../credentials';
import AfterDashboard from './components/AfterDashboard';
import AfterNavLinks from './components/AfterNavLinks';
import BeforeLogin from './components/BeforeLogin';
import DemoUIFieldCell from './components/DemoUIField/Cell';
import DemoUIFieldField from './components/DemoUIField/Field';
import Logout from './components/Logout';
import CustomDefaultRoute from './components/views/CustomDefault';
import CustomMinimalRoute from './components/views/CustomMinimal';
import { globalSlug, slug } from './shared';

export interface Post {
  createdAt: Date;
  description: string;
  id: string;
  title: string;
  updatedAt: Date;
}

export default buildConfigWithDefaults({
  admin: {
    css: path.resolve(__dirname, 'styles.scss'),
    components: {
      // providers: [CustomProvider, CustomProvider],
      routes: [
        {
          path: '/custom-minimal-route',
          Component: CustomMinimalRoute,
        },
        {
          path: '/custom-default-route',
          Component: CustomDefaultRoute,
        },
      ],
      afterDashboard: [
        AfterDashboard,
      ],
      beforeLogin: [
        BeforeLogin,
      ],
      logout: {
        Button: Logout,
      },
      afterNavLinks: [
        AfterNavLinks,
      ],
      views: {
        // Dashboard: CustomDashboardView,
        // Account: CustomAccountView,
      },
    },
  },
  i18n: {
    resources: {
      en: {
        general: {
          dashboard: 'Home',
        },
      },
    },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'hidden-collection',
      admin: {
        hidden: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug,
      labels: {
        singular: {
          en: 'Post en',
          es: 'Post es',
        },
        plural: {
          en: 'Posts en',
          es: 'Posts es',
        },
      },
      admin: {
        description: { en: 'Description en', es: 'Description es' },
        listSearchableFields: ['title', 'description', 'number'],
        group: { en: 'One', es: 'Una' },
        useAsTitle: 'title',
        defaultColumns: ['id', 'number', 'title', 'description', 'demoUIField'],
      },
      fields: [
        {
          name: 'title',
          label: {
            en: 'Title en',
            es: 'Title es',
          },
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
        {
          name: 'richText',
          type: 'richText',
          admin: {
            elements: [
              'relationship',
            ],
          },
        },
        {
          type: 'ui',
          name: 'demoUIField',
          label: { en: 'Demo UI Field', de: 'Demo UI Field de' },
          admin: {
            components: {
              Field: DemoUIFieldField,
              Cell: DemoUIFieldCell,
            },
          },
        },
      ],
    },
    {
      slug: 'group-one-collection-ones',
      admin: {
        group: { en: 'One', es: 'Una' },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-one-collection-twos',
      admin: {
        group: { en: 'One', es: 'Una' },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-two-collection-ones',
      admin: {
        group: 'Two',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-two-collection-twos',
      admin: {
        group: 'Two',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'geo',
      fields: [
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
  ],
  globals: [
    {
      slug: 'hidden-global',
      admin: {
        hidden: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: globalSlug,
      label: {
        en: 'Global en',
        es: 'Global es',
      },
      admin: {
        group: 'Group',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-globals-one',
      admin: {
        group: 'Group',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-globals-two',
      admin: {
        group: 'Group',
      },
      fields: [
        {
          name: 'title',
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

    await mapAsync([...Array(11)], async () => {
      await payload.create({
        collection: slug,
        data: {
          title: 'title',
          description: 'description',
        },
      });
    });

    await payload.create({
      collection: 'geo',
      data: {
        point: [7, -7],
      },
    });

    await payload.create({
      collection: 'geo',
      data: {
        point: [5, -5],
      },
    });
  },
});

import path from 'path';
import { mapAsync } from '../../src/utilities/mapAsync';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import AfterDashboard from './components/AfterDashboard';
import CustomMinimalRoute from './components/views/CustomMinimal';
import CustomDefaultRoute from './components/views/CustomDefault';
import BeforeLogin from './components/BeforeLogin';
import AfterNavLinks from './components/AfterNavLinks';
import { globalSlug, slug } from './shared';
import Logout from './components/Logout';
import DemoUIFieldField from './components/DemoUIField/Field';
import DemoUIFieldCell from './components/DemoUIField/Cell';

export interface Post {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export default buildConfig({
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
          label: 'Demo UI Field',
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
  },
});

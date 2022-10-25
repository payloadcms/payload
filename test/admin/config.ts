import path from 'path';
import { mapAsync } from '../../src/utilities/mapAsync';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import AfterDashboard from './components/AfterDashboard';
import CustomMinimalRoute from './components/views/CustomMinimal';
import CustomDefaultRoute from './components/views/CustomDefault';
import BeforeLogin from './components/BeforeLogin';
import AfterNavLinks from './components/AfterNavLinks';
import { slug, globalSlug } from './shared';
import Logout from './components/Logout';

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
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug,
      admin: {
        listSearchableFields: ['title', 'description', 'number'],
        group: 'One',
      },
      fields: [
        {
          name: 'title',
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
      ],
    },
    {
      slug: 'group-one-collection-ones',
      admin: {
        group: 'One',
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
        group: 'One',
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
      slug: globalSlug,
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

import { mapAsync } from '../../src/utilities/mapAsync';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import AfterDashboard from './components/AfterDashboard';
import CustomMinimalRoute from './components/views/CustomMinimal';
import CustomDefaultRoute from './components/views/CustomDefault';
import BeforeLogin from './components/BeforeLogin';
import AfterNavLinks from './components/AfterNavLinks';

export const slug = 'posts';
export const globalSlug = 'global';

export interface Post {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export default buildConfig({
  admin: {
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
      slug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
  ],
  globals: [
    {
      slug: globalSlug,
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

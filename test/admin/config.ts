import path from 'path'

import { mapAsync } from '../../packages/payload/src/utilities/mapAsync'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { CustomViews1, customViews1Slug } from './collections/CustomViews1'
import { CustomViews2, customViews2Slug } from './collections/CustomViews2'
import { Geo } from './collections/Geo'
import { CollectionGroup1A } from './collections/Group1A'
import { CollectionGroup1B } from './collections/Group1B'
import { CollectionGroup2A } from './collections/Group2A'
import { CollectionGroup2B } from './collections/Group2B'
import { CollectionHidden } from './collections/Hidden'
import { CollectionNoApiView } from './collections/NoApiView'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import AfterDashboard from './components/AfterDashboard'
import AfterNavLinks from './components/AfterNavLinks'
import BeforeLogin from './components/BeforeLogin'
import Logout from './components/Logout'
import CustomDefaultView from './components/views/CustomDefault'
import CustomMinimalRoute from './components/views/CustomMinimal'
import { CustomGlobalViews1 } from './globals/CustomViews1'
import { CustomGlobalViews2 } from './globals/CustomViews2'
import { Global } from './globals/Global'
import { GlobalGroup1A } from './globals/Group1A'
import { GlobalGroup1B } from './globals/Group1B'
import { GlobalHidden } from './globals/Hidden'
import { GlobalNoApiView } from './globals/NoApiView'
import { noApiViewCollection, postsSlug } from './shared'

export interface Post {
  createdAt: Date
  description: string
  id: string
  title: string
  updatedAt: Date
}

export default buildConfigWithDefaults({
  admin: {
    css: path.resolve(__dirname, 'styles.scss'),
    components: {
      // providers: [CustomProvider, CustomProvider],
      afterDashboard: [AfterDashboard],
      beforeLogin: [BeforeLogin],
      logout: {
        Button: Logout,
      },
      afterNavLinks: [AfterNavLinks],
      views: {
        // Dashboard: CustomDashboardView,
        // Account: CustomAccountView,
        CustomMinimalRoute: {
          path: '/custom-minimal-view',
          Component: CustomMinimalRoute,
        },
        CustomDefaultRoute: {
          path: '/custom-default-view',
          Component: CustomDefaultView,
        },
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
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  collections: [
    Posts,
    Users,
    CollectionHidden,
    CollectionNoApiView,
    CustomViews1,
    CustomViews2,
    CollectionGroup1A,
    CollectionGroup1B,
    CollectionGroup2A,
    CollectionGroup2B,
    Geo,
  ],
  globals: [
    GlobalHidden,
    GlobalNoApiView,
    Global,
    CustomGlobalViews1,
    CustomGlobalViews2,
    GlobalGroup1A,
    GlobalGroup1B,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await mapAsync([...Array(11)], async () => {
      await payload.create({
        collection: postsSlug,
        data: {
          title: 'Title',
          description: 'Description',
        },
      })
    })

    await payload.create({
      collection: customViews1Slug,
      data: {
        title: 'Custom View',
      },
    })

    await payload.create({
      collection: customViews2Slug,
      data: {
        title: 'Custom View',
      },
    })

    await payload.create({
      collection: 'geo',
      data: {
        point: [7, -7],
      },
    })

    await payload.create({
      collection: 'geo',
      data: {
        point: [5, -5],
      },
    })

    await payload.create({
      collection: noApiViewCollection,
      data: {},
    })
  },
})

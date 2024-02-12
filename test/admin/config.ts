import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { CustomViews1 } from './collections/CustomViews1'
import { CustomViews2 } from './collections/CustomViews2'
import { Geo } from './collections/Geo'
import { CollectionGroup1A } from './collections/Group1A'
import { CollectionGroup1B } from './collections/Group1B'
import { CollectionGroup2A } from './collections/Group2A'
import { CollectionGroup2B } from './collections/Group2B'
import { CollectionHidden } from './collections/Hidden'
import { CustomIdTab } from './collections/CustomIdTab'
import { CustomIdRow } from './collections/CustomIdRow'
import { CollectionNoApiView } from './collections/NoApiView'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import AdminButton from './components/AdminButton'
import AfterDashboard from './components/AfterDashboard'
import AfterNavLinks from './components/AfterNavLinks'
import BeforeLogin from './components/BeforeLogin'
import Logout from './components/Logout'
import CustomDefaultView from './components/views/CustomDefault'
import CustomMinimalRoute from './components/views/CustomMinimal'
import CustomView from './components/views/CustomView'
import CustomNestedView from './components/views/CustomViewNested'
import { CustomGlobalViews1 } from './globals/CustomViews1'
import { CustomGlobalViews2 } from './globals/CustomViews2'
import { Global } from './globals/Global'
import { GlobalGroup1A } from './globals/Group1A'
import { GlobalGroup1B } from './globals/Group1B'
import { GlobalHidden } from './globals/Hidden'
import { GlobalNoApiView } from './globals/NoApiView'
import { clearAndSeedEverything } from './seed'
import { customNestedViewPath, customViewPath } from './shared'

export default buildConfigWithDefaults({
  admin: {
    css: path.resolve(__dirname, 'styles.scss'),
    components: {
      // providers: [CustomProvider, CustomProvider],
      actions: [AdminButton],
      afterDashboard: [AfterDashboard],
      beforeLogin: [BeforeLogin],
      logout: {
        Button: Logout,
      },
      afterNavLinks: [AfterNavLinks],
      views: {
        // Dashboard: CustomDashboardView,
        // Account: CustomAccountView,
        CustomMinimalView: {
          path: '/custom-minimal-view',
          Component: CustomMinimalRoute,
        },
        CustomDefaultView: {
          path: '/custom-default-view',
          Component: CustomDefaultView,
        },
        CustomView: {
          path: customViewPath,
          exact: true,
          Component: CustomView,
        },
        CustomNestedView: {
          path: customNestedViewPath,
          Component: CustomNestedView,
        },
      },
    },
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config?.resolve?.alias,
          fs: path.resolve(__dirname, './mocks/emptyModule.js'),
        },
      },
    }),
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
    locales: [
      {
        label: {
          es: 'Español',
          en: 'Spanish',
        },
        code: 'es',
      },
      {
        label: {
          es: 'Inglés',
          en: 'English',
        },
        code: 'en',
      },
    ],
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
    CustomIdTab,
    CustomIdRow,
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
    await clearAndSeedEverything(payload)
  },
})

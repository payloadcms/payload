import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { CustomIdRow } from './collections/CustomIdRow.js'
import { CustomIdTab } from './collections/CustomIdTab.js'
import { CustomViews1 } from './collections/CustomViews1.js'
import { CustomViews2 } from './collections/CustomViews2.js'
import { Geo } from './collections/Geo.js'
import { CollectionGroup1A } from './collections/Group1A.js'
import { CollectionGroup1B } from './collections/Group1B.js'
import { CollectionGroup2A } from './collections/Group2A.js'
import { CollectionGroup2B } from './collections/Group2B.js'
import { CollectionHidden } from './collections/Hidden.js'
import { CollectionNoApiView } from './collections/NoApiView.js'
import { Posts } from './collections/Posts.js'
import { UploadCollection } from './collections/Upload.js'
import { Users } from './collections/Users.js'
import { AdminButton } from './components/AdminButton/index.js'
import { AfterDashboard } from './components/AfterDashboard/index.js'
import { AfterNavLinks } from './components/AfterNavLinks/index.js'
import { BeforeLogin } from './components/BeforeLogin/index.js'
import { CustomProvider } from './components/CustomProvider/index.js'
import { Logout } from './components/Logout/index.js'
import { CustomDefaultView } from './components/views/CustomDefault/index.js'
import { CustomMinimalView } from './components/views/CustomMinimal/index.js'
import { CustomView } from './components/views/CustomView/index.js'
import { CustomNestedView } from './components/views/CustomViewNested/index.js'
import { CustomViewWithParam } from './components/views/CustomViewWithParam/index.js'
import { CustomGlobalViews1 } from './globals/CustomViews1.js'
import { CustomGlobalViews2 } from './globals/CustomViews2.js'
import { Global } from './globals/Global.js'
import { GlobalGroup1A } from './globals/Group1A.js'
import { GlobalGroup1B } from './globals/Group1B.js'
import { GlobalHidden } from './globals/Hidden.js'
import { GlobalNoApiView } from './globals/NoApiView.js'
import { clearAndSeedEverything } from './seed.js'
import { customNestedViewPath, customParamViewPath, customViewPath } from './shared.js'

export default buildConfigWithDefaults({
  admin: {
    components: {
      actions: [AdminButton],
      afterDashboard: [AfterDashboard],
      afterNavLinks: [AfterNavLinks],
      beforeLogin: [BeforeLogin],
      logout: {
        Button: Logout,
      },
      providers: [CustomProvider, CustomProvider],
      views: {
        // Dashboard: CustomDashboardView,
        // Account: CustomAccountView,
        CustomDefaultView: {
          Component: CustomDefaultView,
          path: '/custom-default-view',
        },
        CustomMinimalView: {
          Component: CustomMinimalView,
          path: '/custom-minimal-view',
        },
        CustomNestedView: {
          Component: CustomNestedView,
          exact: true,
          path: customNestedViewPath,
        },
        CustomView: {
          Component: CustomView,
          exact: true,
          path: customViewPath,
          strict: true,
        },
        CustomViewWithParam: {
          Component: CustomViewWithParam,
          path: customParamViewPath,
        },
      },
    },
  },
  collections: [
    UploadCollection,
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
  i18n: {
    translations: {
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
        code: 'es',
        label: {
          en: 'Spanish',
          es: 'Español',
        },
      },
      {
        code: 'en',
        label: {
          en: 'English',
          es: 'Inglés',
        },
      },
    ],
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await clearAndSeedEverything(payload)
    }
  },
})

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Array } from './collections/Array.js'
import { BaseListFilter } from './collections/BaseListFilter.js'
import { CustomFields } from './collections/CustomFields/index.js'
import { CustomListDrawer } from './collections/CustomListDrawer/index.js'
import { CustomViews1 } from './collections/CustomViews1.js'
import { CustomViews2 } from './collections/CustomViews2.js'
import { DisableBulkEdit } from './collections/DisableBulkEdit.js'
import { DisableCopyToLocale } from './collections/DisableCopyToLocale.js'
import { DisableDuplicate } from './collections/DisableDuplicate.js'
import { EditMenuItems } from './collections/editMenuItems.js'
import { FormatDocURL } from './collections/FormatDocURL/index.js'
import { Geo } from './collections/Geo.js'
import { CollectionGroup1A } from './collections/Group1A.js'
import { CollectionGroup1B } from './collections/Group1B.js'
import { CollectionGroup2A } from './collections/Group2A.js'
import { CollectionGroup2B } from './collections/Group2B.js'
import { CollectionHidden } from './collections/Hidden.js'
import { ListDrawer } from './collections/ListDrawer.js'
import { ListSelectionItems } from './collections/ListSelectionItems.js'
import { ListViewSelectAPI } from './collections/ListViewSelectAPI/index.js'
import { Localized } from './collections/Localized.js'
import { CollectionNoApiView } from './collections/NoApiView.js'
import { NoTimestampsCollection } from './collections/NoTimestamps.js'
import { CollectionNotInView } from './collections/NotInView.js'
import { Placeholder } from './collections/Placeholder.js'
import { Posts } from './collections/Posts.js'
import { ReorderTabs } from './collections/ReorderTabs.js'
import { UploadCollection } from './collections/Upload.js'
import { UploadTwoCollection } from './collections/UploadTwo.js'
import { UseAsTitleGroupField } from './collections/UseAsTitleGroupField.js'
import { Users } from './collections/Users.js'
import { Virtuals } from './collections/Virtuals.js'
import { with300Documents } from './collections/With300Documents.js'
import { CustomGlobalViews1 } from './globals/CustomViews1.js'
import { CustomGlobalViews2 } from './globals/CustomViews2.js'
import { Global } from './globals/Global.js'
import { GlobalGroup1A } from './globals/Group1A.js'
import { GlobalGroup1B } from './globals/Group1B.js'
import { GlobalHidden } from './globals/Hidden.js'
import { GlobalNoApiView } from './globals/NoApiView.js'
import { GlobalNotInView } from './globals/NotInView.js'
import { Settings } from './globals/Settings.js'
import { seed } from './seed.js'
import {
  BASE_PATH,
  customAdminRoutes,
  customNestedViewPath,
  customParamViewPath,
  customRootViewMetaTitle,
  customViewPath,
  protectedCustomNestedViewPath,
  publicCustomViewPath,
} from './shared.js'
import { editMenuItemsSlug, reorderTabsSlug } from './slugs.js'
process.env.NEXT_BASE_PATH = BASE_PATH

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
export default buildConfigWithDefaults({
  admin: {
    livePreview: {
      collections: [reorderTabsSlug, editMenuItemsSlug],
      url: 'http://localhost:3000',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      actions: ['/components/actions/AdminButton/index.js#AdminButton'],
      afterDashboard: [
        '/components/AfterDashboard/index.js#AfterDashboard',
        '/components/AfterDashboardClient/index.js#AfterDashboardClient',
      ],
      afterNavLinks: ['/components/AfterNavLinks/index.js#AfterNavLinks'],
      beforeLogin: ['/components/BeforeLogin/index.js#BeforeLogin'],
      graphics: {
        Logo: '/components/graphics/Logo.js#Logo',
        Icon: '/components/graphics/Icon.js#Icon',
      },
      header: ['/components/CustomHeader/index.js#CustomHeader'],
      logout: {
        Button: '/components/Logout/index.js#Logout',
      },
      settingsMenu: [
        '/components/SettingsMenuItems/Item1.tsx#SettingsMenuItem1',
        '/components/SettingsMenuItems/Item2.tsx#SettingsMenuItem2',
      ],
      providers: [
        '/components/CustomProviderServer/index.js#CustomProviderServer',
        '/components/CustomProvider/index.js#CustomProvider',
      ],
      views: {
        // Dashboard: CustomDashboardView,
        // Account: CustomAccountView,
        collections: {
          Component: '/components/views/CustomView/index.js#CustomView',
          path: '/collections',
        },
        CustomDefaultView: {
          Component: '/components/views/CustomDefault/index.js#CustomDefaultView',
          path: '/custom-default-view',
        },
        CustomMinimalView: {
          Component: '/components/views/CustomMinimal/index.js#CustomMinimalView',
          path: '/custom-minimal-view',
          meta: {
            title: customRootViewMetaTitle,
          },
        },
        CustomNestedView: {
          Component: '/components/views/CustomViewNested/index.js#CustomNestedView',
          exact: true,
          path: customNestedViewPath,
        },
        CustomView: {
          Component: '/components/views/CustomView/index.js#CustomView',
          exact: true,
          path: customViewPath,
          strict: true,
        },
        ProtectedCustomNestedView: {
          Component: '/components/views/CustomProtectedView/index.js#CustomProtectedView',
          exact: true,
          path: protectedCustomNestedViewPath,
        },
        PublicCustomView: {
          Component: '/components/views/CustomView/index.js#CustomView',
          exact: true,
          path: publicCustomViewPath,
          strict: true,
        },
        CustomViewWithParam: {
          Component: '/components/views/CustomViewWithParam/index.js#CustomViewWithParam',
          path: customParamViewPath,
        },
      },
    },
    meta: {
      description: 'This is a custom meta description',
      icons: [
        {
          type: 'image/png',
          rel: 'icon',
          url: '/custom-favicon-dark.png',
        },
        {
          type: 'image/png',
          media: '(prefers-color-scheme: dark)',
          rel: 'icon',
          url: '/custom-favicon-light.png',
        },
      ],
      openGraph: {
        description: 'This is a custom OG description',
        title: 'This is a custom OG title',
      },
      titleSuffix: '- Custom Title Suffix',
    },
    routes: customAdminRoutes,
    dependencies: {
      myTestComponent: {
        path: '/components/TestComponent.js#TestComponent',
        type: 'component',
        clientProps: {
          test: 'hello',
        },
      },
    },
  },
  collections: [
    UploadCollection,
    UploadTwoCollection,
    Posts,
    Users,
    CollectionHidden,
    CollectionNotInView,
    CollectionNoApiView,
    CustomViews1,
    CustomViews2,
    ReorderTabs,
    CustomFields,
    CollectionGroup1A,
    CollectionGroup1B,
    CollectionGroup2A,
    CollectionGroup2B,
    Geo,
    Array,
    DisableDuplicate,
    DisableCopyToLocale,
    EditMenuItems,
    FormatDocURL,
    BaseListFilter,
    ListSelectionItems,
    with300Documents,
    ListDrawer,
    Placeholder,
    UseAsTitleGroupField,
    DisableBulkEdit,
    CustomListDrawer,
    ListViewSelectAPI,
    Virtuals,
    NoTimestampsCollection,
    Localized,
  ],
  globals: [
    GlobalHidden,
    GlobalNotInView,
    GlobalNoApiView,
    Global,
    CustomGlobalViews1,
    CustomGlobalViews2,
    GlobalGroup1A,
    GlobalGroup1B,
    Settings,
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
    defaultLocalePublishOption: 'active',
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
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

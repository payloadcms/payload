/* eslint-disable no-restricted-exports */
import { defineRscConfig } from 'payload/shared'
import React from 'react'

import { AllButtons } from './collections/CustomFields/fields/Buttons/index.js'
import { CustomServerDescription } from './collections/CustomFields/fields/Text/DescriptionServer.js'
import { CustomServerLabel } from './collections/CustomFields/fields/Text/LabelServer.js'
import { BeforeListTable } from './collections/ListViewSelectAPI/BeforeListTable/index.js'
import { AdminButton } from './components/actions/AdminButton/index.js'
import { CollectionAPIButton } from './components/actions/CollectionAPIButton/index.js'
import { CollectionEditButton } from './components/actions/CollectionEditButton/index.js'
import { CollectionListButton } from './components/actions/CollectionListButton/index.js'
import { GlobalAPIButton } from './components/actions/GlobalAPIButton/index.js'
import { GlobalEditButton } from './components/actions/GlobalEditButton/index.js'
import { AfterDashboard } from './components/AfterDashboard/index.js'
import { AfterDashboardClient } from './components/AfterDashboardClient/index.js'
import { AfterNav } from './components/AfterNav/index.js'
import { AfterNavLinks } from './components/AfterNavLinks/index.js'
import { Banner } from './components/Banner/index.js'
import { CustomDraftButton } from './components/BeforeDocumentControls/CustomDraftButton/index.js'
import { CustomSaveButton } from './components/BeforeDocumentControls/CustomSaveButton/index.js'
import { SelectPostsButton } from './components/BeforeList/index.js'
import { BeforeLogin } from './components/BeforeLogin/index.js'
import { BeforeNav } from './components/BeforeNav/index.js'
import { BeforeNavLinks } from './components/BeforeNavLinks/index.js'
import { CustomHeader } from './components/CustomHeader/index.js'
import { CustomProvider } from './components/CustomProvider/index.js'
import { CustomProviderServer } from './components/CustomProviderServer/index.js'
import { CustomTabComponent } from './components/CustomTabComponent/index.js'
import { DemoUIFieldCell } from './components/DemoUIField/Cell.js'
import { DemoUIField } from './components/DemoUIField/Field.js'
import { EditMenuItems } from './components/EditMenuItems/index.js'
import { EditMenuItemsServer } from './components/EditMenuItemsServer/index.js'
import { Icon } from './components/graphics/Icon.js'
import { Logo } from './components/graphics/Logo.js'
import { ListMenuItemsExample } from './components/ListMenuItems/index.js'
import { Logout } from './components/Logout/index.js'
import { ResetDefaultColumnsButton } from './components/ResetColumns/index.js'
import { SettingsMenuItem1 } from './components/SettingsMenuItems/Item1.js'
import { SettingsMenuItem2 } from './components/SettingsMenuItems/Item2.js'
import { Status } from './components/Status/index.js'
import { ViewDescription } from './components/ViewDescription/index.js'
import { ButtonStyles } from './components/views/ButtonStyles/index.js'
import { CustomDefaultView } from './components/views/CustomDefault/index.js'
import { CustomEditView } from './components/views/CustomEdit/index.js'
import { CustomDefaultEditView } from './components/views/CustomEditDefault/index.js'
import { CustomMinimalView } from './components/views/CustomMinimal/index.js'
import { CustomProtectedView } from './components/views/CustomProtectedView/index.js'
import { CustomTabComponentView } from './components/views/CustomTabComponent/index.js'
import { CustomTabLabelView } from './components/views/CustomTabLabel/index.js'
import { CustomNestedTabView } from './components/views/CustomTabNested/index.js'
import { CustomTabWithParamView } from './components/views/CustomTabWithParam/index.js'
import { CustomVersionsView } from './components/views/CustomVersions/index.js'
import { CustomView } from './components/views/CustomView/index.js'
import { CustomNestedView } from './components/views/CustomViewNested/index.js'
import { CustomViewWithParam } from './components/views/CustomViewWithParam/index.js'
import {
  customCollectionParamViewPath,
  customCollectionParamViewPathBase,
  customDefaultTabMetaTitle,
  customEditLabel,
  customNestedTabViewPath,
  customNestedViewPath,
  customParamViewPath,
  customRootViewMetaTitle,
  customTabComponent,
  customTabLabel,
  customTabViewPath,
  customVersionsTabMetaTitle,
  customViewMetaTitle,
  customViewPath,
  overriddenDefaultRouteTabLabel,
  protectedCustomNestedViewPath,
  publicCustomViewPath,
} from './shared.js'
import {
  customDocumentControlsSlug,
  customFieldsSlug,
  customGlobalDocumentControlsSlug,
  customGlobalViews1GlobalSlug,
  customGlobalViews2GlobalSlug,
  customViews1CollectionSlug,
  customViews2CollectionSlug,
  editMenuItemsSlug,
  geoCollectionSlug,
  globalSlug,
  listDrawerSlug,
  postsCollectionSlug,
  reorderTabsSlug,
} from './slugs.js'

export default defineRscConfig({
  admin: {
    actions: [AdminButton],
    afterDashboard: [AfterDashboard, AfterDashboardClient],
    afterNav: [AfterNav],
    afterNavLinks: [AfterNavLinks],
    beforeLogin: [BeforeLogin],
    beforeNav: [BeforeNav],
    beforeNavLinks: [BeforeNavLinks],
    graphics: {
      Icon,
      Logo,
    },
    header: [CustomHeader],
    logout: {
      Button: Logout,
    },
    providers: [CustomProvider, CustomProviderServer],
    settingsMenu: [SettingsMenuItem1, SettingsMenuItem2],
    views: {
      ButtonShowcase: {
        Component: ButtonStyles,
        path: '/button-styles',
      },
      collections: {
        Component: CustomView,
        path: '/collections',
      },
      CustomDefaultView: {
        Component: CustomDefaultView,
        path: '/custom-default-view',
      },
      CustomMinimalView: {
        Component: CustomMinimalView,
        meta: {
          title: customRootViewMetaTitle,
        },
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
      ProtectedCustomNestedView: {
        Component: CustomProtectedView,
        exact: true,
        path: protectedCustomNestedViewPath,
      },
      PublicCustomView: {
        Component: CustomView,
        exact: true,
        path: publicCustomViewPath,
        strict: true,
      },
    },
  },
  collections: {
    [customDocumentControlsSlug]: {
      edit: {
        Status,
      },
    },
    [customViews1CollectionSlug]: {
      Description: ViewDescription,
      views: {
        edit: {
          root: {
            Component: CustomEditView,
          },
        },
      },
    },
    [customViews2CollectionSlug]: {
      views: {
        edit: {
          api: {
            tab: {
              Component: <CustomTabComponent label={overriddenDefaultRouteTabLabel} />,
            },
          },
          customViewWithParam: {
            Component: CustomTabWithParamView,
            path: customCollectionParamViewPath,
            tab: {
              href: `${customCollectionParamViewPathBase}/123`,
              label: 'Custom Param View',
            },
          },
          default: {
            meta: {
              title: customDefaultTabMetaTitle,
            },
            tab: {
              label: customEditLabel,
            },
          },
          myCustomView: {
            Component: CustomTabLabelView,
            meta: {
              title: customViewMetaTitle,
            },
            path: '/custom-tab-view',
            tab: {
              href: '/custom-tab-view',
              label: customTabLabel,
            },
          },
          myCustomViewWithCustomTab: {
            Component: <CustomTabComponentView label={customTabComponent} />,
            path: customTabViewPath,
            tab: {
              Component: <CustomTabComponent label={customTabComponent} />,
            },
          },
          myCustomViewWithNestedPath: {
            Component: CustomNestedTabView,
            meta: {
              title: 'Custom Nested Meta Title',
            },
            path: customNestedTabViewPath,
            tab: {
              href: customNestedTabViewPath,
              label: 'Custom Nested Tab View',
            },
          },
          versions: {
            Component: CustomVersionsView,
            meta: {
              title: customVersionsTabMetaTitle,
            },
          },
        },
      },
    },
    [editMenuItemsSlug]: {
      edit: {
        editMenuItems: [EditMenuItemsServer, EditMenuItems],
      },
    },
    [geoCollectionSlug]: {
      views: {
        edit: {
          api: {
            actions: [CollectionAPIButton],
          },
          default: {
            actions: [CollectionEditButton],
          },
        },
        list: {
          actions: [CollectionListButton],
        },
      },
    },
    ['list-view-select-api']: {
      beforeListTable: [BeforeListTable],
    },
    [listDrawerSlug]: {
      beforeListTable: [SelectPostsButton],
    },
    [postsCollectionSlug]: {
      afterList: [<Banner message="AfterList custom component" />],
      afterListTable: [<Banner message="AfterListTable custom component" />],
      beforeList: [<Banner message="BeforeList custom component" />],
      beforeListTable: [
        <Banner message="BeforeListTable custom component" />,
        ResetDefaultColumnsButton,
      ],
      Description: ViewDescription,
      edit: {
        beforeDocumentControls: [CustomDraftButton, CustomSaveButton],
      },
      listMenuItems: [ListMenuItemsExample],
    },
    [reorderTabsSlug]: {
      views: {
        edit: {
          api: {
            tab: {
              order: 0,
            },
          },
          default: {
            tab: {
              order: 100,
            },
          },
          test: {
            Component: CustomEditView,
            path: '/test',
            tab: {
              href: '/test',
              label: 'Test',
              order: 50,
            },
          },
        },
      },
    },
  },
  fields: {
    [`${customFieldsSlug}.allButtons`]: {
      components: {
        Field: AllButtons,
      },
    },
    [`${customFieldsSlug}.customTextServerField`]: {
      components: {
        Description: CustomServerDescription,
        Label: CustomServerLabel,
      },
    },
    [`${postsCollectionSlug}.demoUIField`]: {
      components: {
        Cell: DemoUIFieldCell,
        Field: DemoUIField,
      },
    },
  },
  globals: {
    [customGlobalDocumentControlsSlug]: {
      elements: {
        Status,
      },
    },
    [customGlobalViews1GlobalSlug]: {
      views: {
        edit: {
          default: {
            Component: CustomEditView,
          },
        },
      },
    },
    [customGlobalViews2GlobalSlug]: {
      views: {
        edit: {
          api: {
            tab: {
              Component: <CustomTabComponent label={overriddenDefaultRouteTabLabel} />,
            },
          },
          default: {
            Component: CustomDefaultEditView,
          },
          myCustomView: {
            Component: CustomTabLabelView,
            path: '/custom-tab-view',
            tab: {
              href: '/custom-tab-view',
              label: 'Custom',
            },
          },
          myCustomViewWithCustomTab: {
            Component: <CustomTabComponentView label={customTabComponent} />,
            path: '/custom-tab-component',
            tab: {
              Component: <CustomTabComponent label={customTabComponent} />,
            },
          },
          versions: {
            Component: CustomVersionsView,
          },
        },
      },
    },
    [globalSlug]: {
      elements: {
        beforeDocumentControls: [CustomDraftButton],
      },
      views: {
        edit: {
          api: {
            actions: [GlobalAPIButton],
          },
          default: {
            actions: [GlobalEditButton],
          },
        },
      },
    },
  },
})

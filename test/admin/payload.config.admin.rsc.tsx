/* eslint-disable no-restricted-exports */
import { defineRscConfig } from 'payload/shared'
import React from 'react'

import { AllButtons } from './collections/CustomFields/fields/Buttons/index.js'
import { CustomServerDescription } from './collections/CustomFields/fields/Text/DescriptionServer.js'
import { CustomServerLabel } from './collections/CustomFields/fields/Text/LabelServer.js'
import { AdminButton } from './components/actions/AdminButton/index.js'
import { CollectionAPIButton } from './components/actions/CollectionAPIButton/index.js'
import { CollectionEditButton } from './components/actions/CollectionEditButton/index.js'
import { CollectionListButton } from './components/actions/CollectionListButton/index.js'
import { GlobalAPIButton } from './components/actions/GlobalAPIButton/index.js'
import { GlobalEditButton } from './components/actions/GlobalEditButton/index.js'
import { AfterDashboard } from './components/AfterDashboard/index.js'
import { AfterDashboardClient } from './components/AfterDashboardClient/index.js'
import { Banner } from './components/Banner/index.js'
import { CustomDraftButton } from './components/BeforeDocumentControls/CustomDraftButton/index.js'
import { CustomSaveButton } from './components/BeforeDocumentControls/CustomSaveButton/index.js'
import { CustomHeader } from './components/CustomHeader/index.js'
import { CustomProviderServer } from './components/CustomProviderServer/index.js'
import { CustomTabComponent } from './components/CustomTabComponent/index.js'
import { DemoUIFieldCell } from './components/DemoUIField/Cell.js'
import { DemoUIField } from './components/DemoUIField/Field.js'
import { EditMenuItemsServer } from './components/EditMenuItemsServer/index.js'
import { Icon } from './components/graphics/Icon.js'
import { Logo } from './components/graphics/Logo.js'
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
  customFieldsSlug,
  customGlobalViews1GlobalSlug,
  customGlobalViews2GlobalSlug,
  customViews1CollectionSlug,
  customViews2CollectionSlug,
  editMenuItemsSlug,
  geoCollectionSlug,
  globalSlug,
  postsCollectionSlug,
  reorderTabsSlug,
} from './slugs.js'

export default defineRscConfig({
  admin: {
    actions: [AdminButton],
    afterDashboard: [AfterDashboard, AfterDashboardClient],
    graphics: {
      Icon,
      Logo,
    },
    header: [CustomHeader],
    providers: [CustomProviderServer],
    views: {
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
    [customViews1CollectionSlug]: {
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
        editMenuItems: [EditMenuItemsServer],
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
    [postsCollectionSlug]: {
      afterList: [<Banner message="AfterList custom component" />],
      afterListTable: [<Banner message="AfterListTable custom component" />],
      beforeList: [<Banner message="BeforeList custom component" />],
      beforeListTable: [<Banner message="BeforeListTable custom component" />],
      edit: {
        beforeDocumentControls: [CustomDraftButton, CustomSaveButton],
      },
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

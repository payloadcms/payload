/* eslint-disable no-restricted-exports */
'use client'
import { defineClientConfig } from 'payload/shared'

import { AfterInput } from './collections/CustomFields/AfterInput.js'
import { BeforeInput } from './collections/CustomFields/BeforeInput.js'
import { CustomError } from './collections/CustomFields/CustomError.js'
import { FieldDescriptionComponent } from './collections/CustomFields/FieldDescription/index.js'
import { CustomInput } from './collections/CustomFields/fields/Select/CustomInput.js'
import { CustomMultiSelect } from './collections/CustomFields/fields/Select/CustomMultiSelect.js'
import { CustomSelect } from './collections/CustomFields/fields/Select/index.js'
import { CustomClientDescription } from './collections/CustomFields/fields/Text/DescriptionClient.js'
import { CustomClientField } from './collections/CustomFields/fields/Text/FieldClient.js'
import { CustomClientLabel } from './collections/CustomFields/fields/Text/LabelClient.js'
import { CustomListDrawer as CustomListDrawerField } from './collections/CustomListDrawer/Component.js'
import { BeforeListTable } from './collections/ListViewSelectAPI/BeforeListTable/index.js'
import { AfterNav } from './components/AfterNav/index.js'
import { AfterNavLinks } from './components/AfterNavLinks/index.js'
import { SelectPostsButton } from './components/BeforeList/index.js'
import { BeforeLogin } from './components/BeforeLogin/index.js'
import { BeforeNav } from './components/BeforeNav/index.js'
import { BeforeNavLinks } from './components/BeforeNavLinks/index.js'
import { CustomCell } from './components/CustomCell/index.js'
import { CustomGroupCell } from './components/CustomGroupCell/index.js'
import { CustomProvider } from './components/CustomProvider/index.js'
import { EditMenuItems } from './components/EditMenuItems/index.js'
import { ListMenuItemsExample } from './components/ListMenuItems/index.js'
import { Logout } from './components/Logout/index.js'
import { ResetDefaultColumnsButton } from './components/ResetColumns/index.js'
import { SettingsMenuItem1 } from './components/SettingsMenuItems/Item1.js'
import { SettingsMenuItem2 } from './components/SettingsMenuItems/Item2.js'
import { Status } from './components/Status/index.js'
import { ViewDescription } from './components/ViewDescription/index.js'
import { ButtonStyles } from './components/views/ButtonStyles/index.js'
import {
  customDocumentControlsSlug,
  customFieldsSlug,
  customGlobalDocumentControlsSlug,
  customViews1CollectionSlug,
  editMenuItemsSlug,
  listDrawerSlug,
  postsCollectionSlug,
} from './slugs.js'

export default defineClientConfig({
  admin: {
    afterNav: [AfterNav],
    afterNavLinks: [AfterNavLinks],
    beforeLogin: [BeforeLogin],
    beforeNav: [BeforeNav],
    beforeNavLinks: [BeforeNavLinks],
    logout: {
      Button: Logout,
    },
    providers: [CustomProvider],
    settingsMenu: [SettingsMenuItem1, SettingsMenuItem2],
    views: {
      ButtonShowcase: {
        Component: ButtonStyles,
        path: '/button-styles',
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
    },
    [editMenuItemsSlug]: {
      edit: {
        editMenuItems: [EditMenuItems],
      },
    },
    ['list-view-select-api']: {
      beforeListTable: [BeforeListTable],
    },
    [listDrawerSlug]: {
      beforeListTable: [SelectPostsButton],
    },
    [postsCollectionSlug]: {
      beforeListTable: [ResetDefaultColumnsButton],
      Description: ViewDescription,
      listMenuItems: [ListMenuItemsExample],
    },
  },
  fields: {
    [`${customFieldsSlug}.arrayFieldWithBeforeAfterInputs`]: {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    [`${customFieldsSlug}.blocksFieldWithBeforeAfterInputs`]: {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    [`${customFieldsSlug}.customMultiSelectField`]: {
      components: {
        Field: CustomMultiSelect,
      },
    },
    [`${customFieldsSlug}.customSelectField`]: {
      components: {
        Field: CustomSelect,
      },
    },
    [`${customFieldsSlug}.customSelectInput`]: {
      components: {
        Field: CustomInput,
      },
    },
    [`${customFieldsSlug}.customTextClientField`]: {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
        Description: CustomClientDescription,
        Error: CustomError,
        Field: CustomClientField,
        Label: CustomClientLabel,
      },
    },
    [`${customFieldsSlug}.customTextServerField`]: {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
        Error: CustomError,
      },
    },
    [`${customFieldsSlug}.descriptionAsComponent`]: {
      components: {
        Description: FieldDescriptionComponent,
      },
    },
    [`${customFieldsSlug}.groupFieldWithBeforeAfterInputs`]: {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    [`${customFieldsSlug}.radioFieldWithBeforeAfterInputs`]: {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    [`${customFieldsSlug}.relationshipFieldWithBeforeAfterInputs`]: {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    [`${postsCollectionSlug}.customCell`]: {
      components: {
        Cell: CustomCell,
      },
    },
    [`${postsCollectionSlug}.groupWithCustomCell`]: {
      components: {
        Cell: CustomGroupCell,
      },
    },
    'custom-list-drawer.customListDrawer': {
      components: {
        Field: CustomListDrawerField,
      },
    },
  },
  globals: {
    [customGlobalDocumentControlsSlug]: {
      elements: {
        Status,
      },
    },
  },
})

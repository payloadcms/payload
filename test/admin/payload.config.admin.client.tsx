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
import { CustomCell } from './components/CustomCell/index.js'
import { CustomGroupCell } from './components/CustomGroupCell/index.js'
import { customFieldsSlug, postsCollectionSlug } from './slugs.js'

export default defineClientConfig({
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
})

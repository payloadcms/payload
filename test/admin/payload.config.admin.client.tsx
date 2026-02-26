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

export default defineClientConfig({
  fields: {
    'custom-fields.arrayFieldWithBeforeAfterInputs': {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    'custom-fields.blocksFieldWithBeforeAfterInputs': {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    'custom-fields.customMultiSelectField': {
      components: {
        Field: CustomMultiSelect,
      },
    },
    'custom-fields.customSelectField': {
      components: {
        Field: CustomSelect,
      },
    },
    'custom-fields.customSelectInput': {
      components: {
        Field: CustomInput,
      },
    },
    'custom-fields.customTextClientField': {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
        Description: CustomClientDescription,
        Error: CustomError,
        Field: CustomClientField,
        Label: CustomClientLabel,
      },
    },
    'custom-fields.customTextServerField': {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
        Error: CustomError,
      },
    },
    'custom-fields.descriptionAsComponent': {
      components: {
        Description: FieldDescriptionComponent,
      },
    },
    'custom-fields.groupFieldWithBeforeAfterInputs': {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    'custom-fields.radioFieldWithBeforeAfterInputs': {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    'custom-fields.relationshipFieldWithBeforeAfterInputs': {
      components: {
        AfterInput: [AfterInput],
        BeforeInput: [BeforeInput],
      },
    },
    'custom-list-drawer.customListDrawer': {
      components: {
        Field: CustomListDrawerField,
      },
    },
    'posts.customCell': {
      components: {
        Cell: CustomCell,
      },
    },
    'posts.groupWithCustomCell': {
      components: {
        Cell: CustomGroupCell,
      },
    },
  },
})

import type { FieldWithPath } from '../../../..'

import array from './Array'
import blocks from './Blocks'
import checkbox from './Checkbox'
import code from './Code'
import collapsible from './Collapsible'
import confirmPassword from './ConfirmPassword'
import date from './DateTime'
import email from './Email'
import group from './Group'
import hidden from './HiddenInput'
import json from './JSON'
import number from './Number'
import password from './Password'
import point from './Point'
import radio from './RadioGroup'
import relationship from './Relationship'
import row from './Row'
import select from './Select'
import tabs from './Tabs'
import text from './Text'
import textarea from './Textarea'
import ui from './UI'
import upload from './Upload'

export type FieldTypes = {
  array: React.ComponentType<any>
  blocks: React.ComponentType<any>
  checkbox: React.ComponentType<any>
  code: React.ComponentType<any>
  collapsible: React.ComponentType<any>
  confirmPassword: React.ComponentType<any>
  date: React.ComponentType<any>
  email: React.ComponentType<any>
  group: React.ComponentType<any>
  hidden: React.ComponentType<any>
  json: React.ComponentType<any>
  number: React.ComponentType<any>
  password: React.ComponentType<any>
  point: React.ComponentType<any>
  radio: React.ComponentType<any>
  relationship: React.ComponentType<any>
  row: React.ComponentType<any>
  select: React.ComponentType<any>
  tabs: React.ComponentType<any>
  text: React.ComponentType<any>
  textarea: React.ComponentType<any>
  ui: React.ComponentType<any>
  upload: React.ComponentType<any>
}

/**
 * Contains all the static components for the field types that are available in the admin.
 * richText is not included here as it's a special case due to the fact that it's an adapter.
 */
export const staticFieldTypes: FieldTypes = {
  array,
  blocks,
  checkbox,
  code,
  collapsible,
  confirmPassword,
  date,
  email,
  group,
  hidden,
  json,
  number,
  password,
  point,
  radio,
  relationship,
  row,
  select,
  tabs,
  text,
  textarea,
  ui,
  upload,
}

/**
 * This returns the component for the respective field type.
 * It's mainly used in the RenderFields components
 */
export function getFieldComponent(field: FieldWithPath): React.ComponentType<any> {
  let FieldComponent: React.ComponentType<any> = null
  if (field.type !== 'richText') {
    FieldComponent = staticFieldTypes[field?.type]
  } else {
    FieldComponent = field.adapter.component
  }
  return FieldComponent
}

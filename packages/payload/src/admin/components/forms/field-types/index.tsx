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
import richText from './RichText'
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
  richText: React.ComponentType<any>
  row: React.ComponentType<any>
  select: React.ComponentType<any>
  tabs: React.ComponentType<any>
  text: React.ComponentType<any>
  textarea: React.ComponentType<any>
  ui: React.ComponentType<any>
  upload: React.ComponentType<any>
}

export const fieldTypes: FieldTypes = {
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
  richText,
  row,
  select,
  tabs,
  text,
  textarea,
  ui,
  upload,
}

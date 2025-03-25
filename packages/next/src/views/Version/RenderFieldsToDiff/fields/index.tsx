import type { FieldDiffClientProps, FieldTypes } from 'payload'

import { Collapsible } from './Collapsible/index.js'
import { Group } from './Group/index.js'
import { Iterable } from './Iterable/index.js'
import { Relationship } from './Relationship/index.js'
import { Row } from './Row/index.js'
import { Select } from './Select/index.js'
import { Tabs } from './Tabs/index.js'
import { Text } from './Text/index.js'

export const diffComponents: Record<FieldTypes, React.ComponentType<FieldDiffClientProps>> = {
  array: Iterable,
  blocks: Iterable,
  checkbox: Text,
  code: Text,
  collapsible: Collapsible,
  date: Text,
  email: Text,
  group: Group,
  join: null,
  json: Text,
  number: Text,
  point: Text,
  radio: Select,
  relationship: Relationship,
  richText: Text,
  row: Row,
  select: Select,
  tabs: Tabs,
  text: Text,
  textarea: Text,
  ui: null,
  upload: Relationship,
}

import Collapsible from './Collapsible/index.js'
import Iterable from './Iterable/index.js'
import Nested from './Nested/index.js'
import Relationship from './Relationship/index.js'
import Select from './Select/index.js'
import Tabs from './Tabs/index.js'
import Text from './Text/index.js'

export const diffComponents = {
  array: Iterable,
  blocks: Iterable,
  checkbox: Text,
  code: Text,
  collapsible: Collapsible,
  date: Text,
  email: Text,
  group: Collapsible,
  json: Text,
  number: Text,
  point: Text,
  radio: Select,
  relationship: Relationship,
  richText: Text,
  row: Nested,
  select: Select,
  tabs: Tabs,
  text: Text,
  textarea: Text,
  upload: Relationship,
}

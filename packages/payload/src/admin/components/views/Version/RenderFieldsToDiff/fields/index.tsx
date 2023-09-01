import Iterable from './Iterable'
import Nested from './Nested'
import Relationship from './Relationship'
import Select from './Select'
import Tabs from './Tabs'
import Text from './Text'

export default {
  array: Iterable,
  blocks: Iterable,
  checkbox: Text,
  code: Text,
  collapsible: Nested,
  date: Text,
  email: Text,
  group: Nested,
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

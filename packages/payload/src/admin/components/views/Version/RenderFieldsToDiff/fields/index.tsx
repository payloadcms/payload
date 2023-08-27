import Text from './Text.js';
import Nested from './Nested.js';
import Iterable from './Iterable.js';
import Relationship from './Relationship.js';
import Tabs from './Tabs.js';
import Select from './Select.js';

export default {
  text: Text,
  textarea: Text,
  number: Text,
  email: Text,
  code: Text,
  json: Text,
  checkbox: Text,
  radio: Select,
  row: Nested,
  collapsible: Nested,
  group: Nested,
  array: Iterable,
  blocks: Iterable,
  date: Text,
  select: Select,
  richText: Text,
  relationship: Relationship,
  upload: Relationship,
  point: Text,
  tabs: Tabs,
};

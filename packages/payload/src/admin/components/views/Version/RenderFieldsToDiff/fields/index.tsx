import Text from './Text/index.js';
import Nested from './Nested/index.js';
import Iterable from './Iterable/index.js';
import Relationship from './Relationship/index.js';
import Tabs from './Tabs/index.js';
import Select from './Select/index.js';

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

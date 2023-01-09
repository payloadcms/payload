import Text from './Text';
import Nested from './Nested';
import Iterable from './Iterable';
import Relationship from './Relationship';
import Tabs from './Tabs';
import Select from './Select';

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

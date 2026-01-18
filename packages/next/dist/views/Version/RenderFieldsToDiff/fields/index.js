import { Collapsible } from './Collapsible/index.js';
import { DateDiffComponent } from './Date/index.js';
import { Group } from './Group/index.js';
import { Iterable } from './Iterable/index.js';
import { Relationship } from './Relationship/index.js';
import { Row } from './Row/index.js';
import { Select } from './Select/index.js';
import { Tabs } from './Tabs/index.js';
import { Text } from './Text/index.js';
import { Upload } from './Upload/index.js';
export const diffComponents = {
  array: Iterable,
  blocks: Iterable,
  checkbox: Text,
  code: Text,
  collapsible: Collapsible,
  date: DateDiffComponent,
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
  upload: Upload
};
//# sourceMappingURL=index.js.map
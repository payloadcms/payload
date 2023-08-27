import code from './Code/index.js';
import json from './JSON/index.js';
import email from './Email/index.js';
import hidden from './HiddenInput/index.js';
import text from './Text/index.js';
import date from './DateTime/index.js';

import password from './Password/index.js';
import confirmPassword from './ConfirmPassword/index.js';
import relationship from './Relationship/index.js';
import textarea from './Textarea/index.js';
import select from './Select/index.js';
import number from './Number/index.js';
import checkbox from './Checkbox/index.js';
import richText from './RichText/index.js';
import radio from './RadioGroup/index.js';
import point from './Point/index.js';

import blocks from './Blocks/index.js';
import group from './Group/index.js';
import array from './Array/index.js';
import row from './Row/index.js';
import collapsible from './Collapsible/index.js';
import tabs from './Tabs/index.js';
import upload from './Upload/index.js';
import ui from './UI/index.js';

export type FieldTypes = {
  code: React.ComponentType<any>
  json: React.ComponentType<any>
  email: React.ComponentType<any>
  hidden: React.ComponentType<any>
  text: React.ComponentType<any>
  date: React.ComponentType<any>
  password: React.ComponentType<any>
  confirmPassword: React.ComponentType<any>
  relationship: React.ComponentType<any>
  textarea: React.ComponentType<any>
  select: React.ComponentType<any>
  number: React.ComponentType<any>
  point: React.ComponentType<any>
  checkbox: React.ComponentType<any>
  richText: React.ComponentType<any>
  radio: React.ComponentType<any>
  blocks: React.ComponentType<any>
  group: React.ComponentType<any>
  array: React.ComponentType<any>
  row: React.ComponentType<any>
  collapsible: React.ComponentType<any>
  tabs: React.ComponentType<any>
  upload: React.ComponentType<any>
  ui: React.ComponentType<any>
}

const fieldTypes: FieldTypes = {
  code,
  json,
  email,
  hidden,
  text,
  date,
  password,
  confirmPassword,
  relationship,
  textarea,
  select,
  number,
  checkbox,
  richText,
  point,
  radio,
  blocks,
  group,
  array,
  row,
  collapsible,
  tabs,
  upload,
  ui,
};

export default fieldTypes;

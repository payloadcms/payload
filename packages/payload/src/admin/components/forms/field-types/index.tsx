import code from './Code.js';
import json from './JSON.js';
import email from './Email.js';
import hidden from './HiddenInput.js';
import text from './Text.js';
import date from './DateTime.js';

import password from './Password.js';
import confirmPassword from './ConfirmPassword.js';
import relationship from './Relationship.js';
import textarea from './Textarea.js';
import select from './Select.js';
import number from './Number.js';
import checkbox from './Checkbox.js';
import richText from './RichText.js';
import radio from './RadioGroup.js';
import point from './Point.js';

import blocks from './Blocks.js';
import group from './Group.js';
import array from './Array.js';
import row from './Row.js';
import collapsible from './Collapsible.js';
import tabs from './Tabs.js';
import upload from './Upload.js';
import ui from './UI.js';

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

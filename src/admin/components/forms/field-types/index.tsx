import code from './Code';
import json from './JSON';
import email from './Email';
import hidden from './HiddenInput';
import text from './Text';
import date from './DateTime';

import password from './Password';
import confirmPassword from './ConfirmPassword';
import relationship from './Relationship';
import textarea from './Textarea';
import select from './Select';
import number from './Number';
import checkbox from './Checkbox';
import richText from './RichText';
import radio from './RadioGroup';
import point from './Point';

import blocks from './Blocks';
import group from './Group';
import array from './Array';
import row from './Row';
import collapsible from './Collapsible';
import tabs from './Tabs';
import upload from './Upload';
import ui from './UI';

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

import code from './Code';
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
import upload from './Upload';
import ui from './UI';

export type FieldTypes = {
  code: React.ComponentType
  email: React.ComponentType
  hidden: React.ComponentType
  text: React.ComponentType
  date: React.ComponentType
  password: React.ComponentType
  confirmPassword: React.ComponentType
  relationship: React.ComponentType
  textarea: React.ComponentType
  select: React.ComponentType
  number: React.ComponentType
  point: React.ComponentType
  checkbox: React.ComponentType
  richText: React.ComponentType
  radio: React.ComponentType
  blocks: React.ComponentType
  group: React.ComponentType
  array: React.ComponentType
  row: React.ComponentType
  upload: React.ComponentType
  ui: React.ComponentType
}

const fieldTypes: FieldTypes = {
  code,
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
  upload,
  ui,
};

export default fieldTypes;

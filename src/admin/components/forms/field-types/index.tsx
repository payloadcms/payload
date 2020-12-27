import code from './Code';
import email from './Email';
import hidden from './HiddenInput';
import text from './Text';
import date from './DateTime';

import password from './Password';
import relationship from './Relationship';
import textarea from './Textarea';
import select from './Select';
import number from './Number';
import checkbox from './Checkbox';
import richText from './RichText';
import radio from './RadioGroup';

import blocks from './Blocks';
import group from './Group';
import array from './Array';
import row from './Row';
import upload from './Upload';

export type FieldTypes = {
  code: React.ComponentType
  email: React.ComponentType
  hidden: React.ComponentType
  text: React.ComponentType
  date: React.ComponentType
  password: React.ComponentType
  relationship: React.ComponentType
  textarea: React.ComponentType
  select: React.ComponentType
  number: React.ComponentType
  checkbox: React.ComponentType
  richText: React.ComponentType
  radio: React.ComponentType
  blocks: React.ComponentType
  group: React.ComponentType
  array: React.ComponentType
  row: React.ComponentType
  upload: React.ComponentType
}

const fieldTypes: FieldTypes = {
  code,
  email,
  hidden,
  text,
  date,
  password,
  relationship,
  textarea,
  select,
  number,
  checkbox,
  richText,
  radio,
  blocks,
  group,
  array,
  row,
  upload,
};

export default fieldTypes;

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
import { Select as select } from './Select';
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
import { FieldTypes } from './types';

export const fieldTypes: FieldTypes = {
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

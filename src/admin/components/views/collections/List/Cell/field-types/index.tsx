import array from './Array';
import blocks from './Blocks';
import checkbox from './Checkbox';
import code from './Code';
import date from './Date';
import json from './JSON';
import relationship from './Relationship';
import richText from './Richtext';
import select from './Select';
import textarea from './Textarea';
import File from './File';


export default {
  array,
  blocks,
  code,
  checkbox,
  date,
  json,
  relationship,
  richText,
  select,
  radio: select,
  textarea,
  upload: relationship,
  File,
};

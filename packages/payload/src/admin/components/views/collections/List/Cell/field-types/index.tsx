import array from './Array/index.js';
import blocks from './Blocks/index.js';
import checkbox from './Checkbox/index.js';
import code from './Code/index.js';
import date from './Date/index.js';
import json from './JSON/index.js';
import relationship from './Relationship/index.js';
import richText from './Richtext/index.js';
import select from './Select/index.js';
import textarea from './Textarea/index.js';
import File from './File/index.js';


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

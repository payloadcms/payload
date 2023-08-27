import array from './Array.js';
import blocks from './Blocks.js';
import checkbox from './Checkbox.js';
import code from './Code.js';
import date from './Date.js';
import json from './JSON.js';
import relationship from './Relationship.js';
import richText from './Richtext.js';
import select from './Select.js';
import textarea from './Textarea.js';
import File from './File.js';


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

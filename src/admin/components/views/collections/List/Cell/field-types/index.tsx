import array from './Array';
import blocks from './Blocks';
import checkbox from './Checkbox';
import code from './Code';
import date from './Date';
import relationship from './Relationship';
import richText from './Richtext';
import lexicalRichText from './LexicalRichText';
import select from './Select';
import textarea from './Textarea';


export default {
  array,
  blocks,
  code,
  checkbox,
  date,
  relationship,
  richText,
  lexicalRichText,
  select,
  radio: select,
  textarea,
  upload: relationship,
};

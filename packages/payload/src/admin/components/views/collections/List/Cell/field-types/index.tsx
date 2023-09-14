import array from './Array'
import blocks from './Blocks'
import checkbox from './Checkbox'
import code from './Code'
import date from './Date'
import File from './File'
import json from './JSON'
import relationship from './Relationship'
import richText from './Richtext'
import select from './Select'
import textarea from './Textarea'

export default {
  File,
  array,
  blocks,
  checkbox,
  code,
  date,
  json,
  radio: select,
  relationship,
  richText,
  select,
  textarea,
  upload: relationship,
}

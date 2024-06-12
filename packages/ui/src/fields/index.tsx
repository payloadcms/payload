import type { FieldTypes } from 'payload/bundle'

import { ArrayField as array } from './Array/index.js'
import { BlocksField as blocks } from './Blocks/index.js'
import { Checkbox as checkbox } from './Checkbox/index.js'
import { Code as code } from './Code/index.js'
import { Collapsible as collapsible } from './Collapsible/index.js'
import { ConfirmPassword as confirmPassword } from './ConfirmPassword/index.js'
import { DateTime as date } from './DateTime/index.js'
import { Email as email } from './Email/index.js'
import { Group as group } from './Group/index.js'
import { HiddenInput as hidden } from './HiddenInput/index.js'
import { JSONField as json } from './JSON/index.js'
import { NumberField as number } from './Number/index.js'
import { Password as password } from './Password/index.js'
import { Point as point } from './Point/index.js'
import { RadioGroup as radio } from './RadioGroup/index.js'
import { Relationship as relationship } from './Relationship/index.js'
import { RichText as richText } from './RichText/index.js'
import { Row as row } from './Row/index.js'
import { Select as select } from './Select/index.js'
import { Tabs as tabs } from './Tabs/index.js'
import { Text as text } from './Text/index.js'
import { Textarea as textarea } from './Textarea/index.js'
import { UI as ui } from './UI/index.js'
import { Upload as upload } from './Upload/index.js'

export * from './shared/index.js'

export const fieldComponents: FieldTypes = {
  array,
  blocks,
  checkbox,
  code,
  collapsible,
  confirmPassword,
  date,
  email,
  group,
  hidden,
  json,
  number,
  password,
  point,
  radio,
  relationship,
  richText,
  row,
  select,
  tabs,
  text,
  textarea,
  ui,
  upload,
}

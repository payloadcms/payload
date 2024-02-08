import { ArrayCell } from './Array'
import { BlocksCell } from './Blocks'
import { CheckboxCell } from './Checkbox'
import { CodeCell } from './Code'
import { DateCell } from './Date'
import { FileCell } from './File'
import { JSONCell } from './JSON'
import { RelationshipCell } from './Relationship'
import { RichTextCell } from './Richtext'
import { SelectCell } from './Select'
import { TextareaCell } from './Textarea'

export default {
  File: FileCell,
  array: ArrayCell,
  blocks: BlocksCell,
  checkbox: CheckboxCell,
  code: CodeCell,
  date: DateCell,
  json: JSONCell,
  radio: SelectCell,
  relationship: RelationshipCell,
  richText: RichTextCell,
  select: SelectCell,
  textarea: TextareaCell,
  upload: RelationshipCell,
}

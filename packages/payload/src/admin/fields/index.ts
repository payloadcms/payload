import type { ArrayFieldProps } from './Array.js'
import type { BlocksFieldProps } from './Blocks.js'
import type { CheckboxFieldProps } from './Checkbox.js'
import type { CodeFieldProps } from './Code.js'
import type { CollapsibleFieldProps } from './Collapsible.js'
import type { DateFieldProps } from './Date.js'
import type { EmailFieldProps } from './Email.js'
import type { GroupFieldProps } from './Group.js'
import type { HiddenFieldProps } from './Hidden.js'
import type { JSONFieldProps } from './JSON.js'
import type { PointFieldProps } from './Point.js'
import type { RelationshipFieldProps } from './Relationship.js'
import type { RichTextComponentProps } from './RichText.js'
import type { RowFieldProps } from './Row.js'
import type { SelectFieldProps } from './Select.js'
import type { TabsFieldProps } from './Tabs.js'
import type { TextFieldProps } from './Text.js'
import type { UploadFieldProps } from './Upload.js'

export type FieldComponentProps =
  | ({
      type: 'array'
    } & ArrayFieldProps)
  | ({
      type: 'blocks'
    } & BlocksFieldProps)
  | ({
      type: 'checkbox'
    } & CheckboxFieldProps)
  | ({
      type: 'code'
    } & CodeFieldProps)
  | ({
      type: 'collapsible'
    } & CollapsibleFieldProps)
  | ({
      type: 'date'
    } & DateFieldProps)
  | ({
      type: 'email'
    } & EmailFieldProps)
  | ({
      type: 'group'
    } & GroupFieldProps)
  | ({
      type: 'hidden'
    } & HiddenFieldProps)
  | ({
      type: 'json'
    } & JSONFieldProps)
  | ({
      type: 'point'
    } & PointFieldProps)
  | ({
      type: 'relationship'
    } & RelationshipFieldProps)
  | ({
      type: 'richText'
    } & RichTextComponentProps)
  | ({
      type: 'row'
    } & RowFieldProps)
  | ({
      type: 'select'
    } & SelectFieldProps)
  | {
      type: 'tabs' & TabsFieldProps
    }
  | ({
      type: 'text'
    } & TextFieldProps)
  | ({
      type: 'upload'
    } & UploadFieldProps)

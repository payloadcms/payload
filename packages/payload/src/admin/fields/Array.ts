import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ArrayField } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly fields: ClientFieldConfig[]
  readonly forceRender?: boolean
  readonly isSortable?: boolean
  readonly labels?: ArrayField['labels']
  readonly maxRows?: ArrayField['maxRows']
  readonly minRows?: ArrayField['minRows']
  readonly name?: string
  readonly width?: string
} & FormFieldBase

export type ArrayFieldLabelComponent = LabelComponent<'array'>

export type ArrayFieldDescriptionComponent = DescriptionComponent<'array'>

export type ArrayFieldErrorComponent = ErrorComponent<'array'>

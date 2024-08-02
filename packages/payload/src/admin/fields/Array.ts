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
  CustomRowLabel?: MappedComponent
  fields: ClientFieldConfig[]
  forceRender?: boolean
  isSortable?: boolean
  labels?: ArrayField['labels']
  maxRows?: ArrayField['maxRows']
  minRows?: ArrayField['minRows']
  name?: string
  width?: string
} & FormFieldBase

export type ArrayFieldLabelComponent = LabelComponent<'array'>

export type ArrayFieldDescriptionComponent = DescriptionComponent<'array'>

export type ArrayFieldErrorComponent = ErrorComponent<'array'>

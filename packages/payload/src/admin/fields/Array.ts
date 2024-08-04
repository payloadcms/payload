import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly clientFieldConfig: GenericClientFieldConfig<'array'>
  readonly forceRender?: boolean
} & FormFieldBase

export type ArrayFieldLabelComponent = LabelComponent<'array'>

export type ArrayFieldDescriptionComponent = DescriptionComponent<'array'>

export type ArrayFieldErrorComponent = ErrorComponent<'array'>

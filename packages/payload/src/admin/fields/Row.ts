import type { MarkOptional } from 'ts-essentials'

import type { RowFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type RowFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<RowFieldProps>
  readonly errorProps?: ErrorProps<RowFieldProps>
  field: MarkOptional<RowFieldClient, 'type'>
  forceRender?: boolean
  indexPath: string
  readonly labelProps?: LabelProps<RowFieldProps>
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<RowFieldProps>

export type RowFieldDescriptionComponent = DescriptionComponent<RowFieldProps>

export type RowFieldErrorComponent = ErrorComponent<RowFieldProps>

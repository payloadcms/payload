import type { MarkOptional } from 'ts-essentials'

import type { DateFieldClient } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type DateFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<DateFieldProps>
  readonly errorProps?: ErrorProps<DateFieldProps>
  readonly field: MarkOptional<DateFieldClient, 'type'>
  readonly labelProps?: LabelProps<DateFieldProps>
  readonly validate?: DateFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type DateFieldLabelComponent = LabelComponent<DateFieldProps>

export type DateFieldDescriptionComponent = DescriptionComponent<DateFieldProps>

export type DateFieldErrorComponent = ErrorComponent<DateFieldProps>

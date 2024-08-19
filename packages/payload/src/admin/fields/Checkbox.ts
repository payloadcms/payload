import type { MarkOptional } from 'ts-essentials'

import type { CheckboxFieldClient } from '../../fields/config/types.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type CheckboxFieldProps = {
  readonly checked?: boolean
  readonly descriptionProps?: FieldDescriptionProps<CheckboxFieldProps>
  readonly disableFormData?: boolean
  readonly errorProps?: ErrorProps<CheckboxFieldProps>
  readonly field: MarkOptional<CheckboxFieldClient, 'type'>
  readonly id?: string
  readonly labelProps?: LabelProps<CheckboxFieldProps>
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly validate?: CheckboxFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type CheckboxFieldLabelComponent = LabelComponent<CheckboxFieldProps>

export type CheckboxFieldDescriptionComponent = DescriptionComponent<CheckboxFieldProps>

export type CheckboxFieldErrorComponent = ErrorComponent<CheckboxFieldProps>

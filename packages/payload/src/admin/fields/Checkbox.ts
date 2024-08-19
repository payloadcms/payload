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

type CheckboxFieldClientWithoutType = MarkOptional<CheckboxFieldClient, 'type'>

export type CheckboxFieldProps = {
  readonly checked?: boolean
  readonly descriptionProps?: FieldDescriptionProps<CheckboxFieldClientWithoutType>
  readonly disableFormData?: boolean
  readonly errorProps?: ErrorProps<CheckboxFieldClientWithoutType>
  readonly field: CheckboxFieldClientWithoutType
  readonly id?: string
  readonly labelProps?: LabelProps<CheckboxFieldClientWithoutType>
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly validate?: CheckboxFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type CheckboxFieldLabelComponent = LabelComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldDescriptionComponent = DescriptionComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldErrorComponent = ErrorComponent<CheckboxFieldProps>

import type { MarkOptional } from 'ts-essentials'

import type { UploadFieldClient } from '../../fields/config/types.js'
import type { UploadFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type UploadFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<UploadFieldProps>
  readonly errorProps?: ErrorProps<UploadFieldProps>
  readonly field: MarkOptional<UploadFieldClient, 'type'>
  readonly labelProps?: LabelProps<UploadFieldProps>
  readonly validate?: UploadFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type UploadFieldLabelComponent = LabelComponent<UploadFieldProps>

export type UploadFieldDescriptionComponent = DescriptionComponent<UploadFieldProps>

export type UploadFieldErrorComponent = ErrorComponent<UploadFieldProps>

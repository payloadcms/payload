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

type UploadFieldClientWithoutType = MarkOptional<UploadFieldClient, 'type'>

export type UploadFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<UploadFieldClientWithoutType>
  readonly errorProps?: ErrorProps<UploadFieldClient>
  readonly field: UploadFieldClientWithoutType
  readonly labelProps?: LabelProps<UploadFieldClientWithoutType>
  readonly validate?: UploadFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type UploadFieldLabelComponent = LabelComponent<UploadFieldClientWithoutType>

export type UploadFieldDescriptionComponent = DescriptionComponent<UploadFieldClientWithoutType>

export type UploadFieldErrorComponent = ErrorComponent<UploadFieldClientWithoutType>

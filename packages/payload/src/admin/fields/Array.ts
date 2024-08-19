import type { MarkOptional } from 'ts-essentials'

import type { ArrayFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

type ArrayFieldClientWithoutType = MarkOptional<ArrayFieldClient, 'type'>

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
} & Omit<FormFieldBase<ArrayFieldClientWithoutType>, 'validate'>

export type ArrayFieldLabelComponent = LabelComponent<ArrayFieldClientWithoutType>

export type ArrayFieldDescriptionComponent = DescriptionComponent<ArrayFieldClientWithoutType>

export type ArrayFieldErrorComponent = ErrorComponent<ArrayFieldClientWithoutType>

import type { MarkOptional } from 'ts-essentials'

import type { GroupFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

type GroupFieldClientWithoutType = MarkOptional<GroupFieldClient, 'type'>

export type GroupFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<GroupFieldClientWithoutType>
  readonly errorProps?: ErrorProps<GroupFieldClientWithoutType>
  readonly field: GroupFieldClientWithoutType
  readonly labelProps?: LabelProps<GroupFieldClientWithoutType>
} & FormFieldBase

export type GroupFieldLabelComponent = LabelComponent<GroupFieldClientWithoutType>

export type GroupFieldDescriptionComponent = DescriptionComponent<GroupFieldClientWithoutType>

export type GroupFieldErrorComponent = ErrorComponent<GroupFieldClientWithoutType>

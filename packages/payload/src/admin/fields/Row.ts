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

type RowFieldClientWithoutType = MarkOptional<RowFieldClient, 'type'>

export type RowFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<RowFieldClientWithoutType>
  readonly errorProps?: ErrorProps<RowFieldClientWithoutType>
  field: RowFieldClientWithoutType
  forceRender?: boolean
  indexPath: string
  readonly labelProps?: LabelProps<RowFieldClientWithoutType>
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<RowFieldClientWithoutType>

export type RowFieldDescriptionComponent = DescriptionComponent<RowFieldClientWithoutType>

export type RowFieldErrorComponent = ErrorComponent<RowFieldClientWithoutType>

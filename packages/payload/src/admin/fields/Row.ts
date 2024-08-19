import type { MarkOptional } from 'ts-essentials'

import type { RowFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldLabelProps,
  FormFieldBase,
  LabelComponent,
} from '../types.js'

type RowFieldClientWithoutType = MarkOptional<RowFieldClient, 'type'>

export type RowFieldProps = {
  forceRender?: boolean
  indexPath: string
  readonly labelProps?: FieldLabelProps<RowFieldClientWithoutType>
} & FormFieldBase<RowFieldClientWithoutType>

export type RowFieldLabelComponent = LabelComponent<RowFieldClientWithoutType>

export type RowFieldDescriptionComponent = DescriptionComponent<RowFieldClientWithoutType>

export type RowFieldErrorComponent = ErrorComponent<RowFieldClientWithoutType>

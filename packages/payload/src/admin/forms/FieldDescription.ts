import type { CustomComponent, LabelFunction, ServerProps } from '../../config/types.js'
import type { FieldTypes } from '../../fields/config/types.js'
import type { FieldComponentProps, MappedComponent } from '../types.js'

export type DescriptionFunction = LabelFunction

export type DescriptionComponent<T extends 'hidden' | FieldTypes = any> = CustomComponent<
  FieldDescriptionProps<T>
>

export type StaticDescription = Record<string, string> | string

export type Description = DescriptionFunction | StaticDescription
export type GenericDescriptionProps = {
  readonly Description?: MappedComponent
  readonly className?: string
  readonly description?: StaticDescription
  readonly marginPlacement?: 'bottom' | 'top'
}
export type FieldDescriptionProps<T extends 'hidden' | FieldTypes = any> = {
  type: T
} & FieldComponentProps &
  GenericDescriptionProps &
  Partial<ServerProps>

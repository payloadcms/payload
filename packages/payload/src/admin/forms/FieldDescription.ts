import type { CustomComponent, LabelFunction, ServerProps } from '../../config/types.js'
import type { FieldTypes } from '../../fields/config/types.js'
import type { FieldComponentProps, MappedComponent } from '../types.js'

export type DescriptionFunction = LabelFunction

export type DescriptionComponent<T extends 'hidden' | FieldTypes = any> = CustomComponent<
  FieldDescriptionProps<T>
>

export type Description = DescriptionFunction | Record<string, string> | string
export type GenericDescriptionProps = {
  CustomDescription?: MappedComponent
  className?: string
  description?: Record<string, string> | string
  marginPlacement?: 'bottom' | 'top'
}
export type FieldDescriptionProps<T extends 'hidden' | FieldTypes = any> = {
  type: T
} & GenericDescriptionProps &
  Partial<ServerProps>

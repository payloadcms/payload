import type { LabelFunction, ServerProps } from '../../config/types.js'
import type { ClientFieldProps } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type DescriptionFunction = LabelFunction

export type DescriptionComponent<T extends ClientFieldProps> = FieldDescriptionProps<T>

export type StaticDescription = Record<string, string> | string

export type Description = DescriptionFunction | StaticDescription

export type GenericDescriptionProps = {
  readonly Description?: MappedComponent
  readonly className?: string
  readonly description?: StaticDescription
  readonly marginPlacement?: 'bottom' | 'top'
}

export type FieldDescriptionProps<T extends ClientFieldProps> = GenericDescriptionProps &
  Partial<ServerProps> &
  T

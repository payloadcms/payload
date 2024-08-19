import type { MarkOptional } from 'ts-essentials'

import type { LabelFunction, ServerProps } from '../../config/types.js'
import type { ClientField, Field } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type DescriptionFunction = LabelFunction

type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type FieldDescriptionClientComponent<
  T extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldDescriptionClientProps<T>>

export type FieldDescriptionServerComponent<T extends Field = Field> = React.ComponentType<
  FieldDescriptionServerProps<T>
>

export type StaticDescription = Record<string, string> | string

export type Description = DescriptionFunction | StaticDescription

export type GenericDescriptionProps = {
  readonly Description?: MappedComponent
  readonly className?: string
  readonly description?: StaticDescription
  readonly marginPlacement?: 'bottom' | 'top'
}

export type FieldDescriptionServerProps<T extends Field = Field> = {
  field: T
} & GenericDescriptionProps &
  Partial<ServerProps>

export type FieldDescriptionClientProps<
  T extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  field: T
} & GenericDescriptionProps

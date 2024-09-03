import type { MarkOptional } from 'ts-essentials'

import type { LabelFunction, ServerProps } from '../../config/types.js'
import type { ClientField, Field } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type DescriptionFunction = LabelFunction

type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type FieldDescriptionClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldDescriptionClientProps<TFieldClient>>

export type FieldDescriptionServerComponent<TFieldServer extends Field = Field> =
  React.ComponentType<FieldDescriptionServerProps<TFieldServer>>

export type StaticDescription = Record<string, string> | string

export type Description = DescriptionFunction | StaticDescription

export type GenericDescriptionProps = {
  readonly className?: string
  readonly Description?: MappedComponent
  readonly description?: StaticDescription
  readonly marginPlacement?: 'bottom' | 'top'
}

export type FieldDescriptionServerProps<TFieldServer extends Field = Field> = {
  field: TFieldServer
} & GenericDescriptionProps &
  Partial<ServerProps>

export type FieldDescriptionClientProps<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  field: TFieldClient
} & GenericDescriptionProps

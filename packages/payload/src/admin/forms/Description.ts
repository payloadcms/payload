import type { TFunction } from '@payloadcms/translations'

import type { ServerProps } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { ClientFieldWithOptionalType } from './Field.js'
import type { Data } from './Form.js'

export type DescriptionFunction = <T = unknown>({
  t,
}: {
  data: Data
  path: string
  t: TFunction
  value?: T
}) => string

export type FieldDescriptionClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldDescriptionClientProps<TFieldClient>>

export type FieldDescriptionServerComponent<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldDescriptionServerProps<TFieldServer, TFieldClient>>

export type StaticDescription = Record<string, string> | string

export type Description = DescriptionFunction | StaticDescription

export type GenericDescriptionProps = {
  readonly className?: string
  readonly description?: StaticDescription
  readonly marginPlacement?: 'bottom' | 'top'
  readonly path: string
}

export type FieldDescriptionServerProps<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  clientField: TFieldClient
  readonly field: TFieldServer
} & GenericDescriptionProps &
  Partial<ServerProps>

export type FieldDescriptionClientProps<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  field: TFieldClient
} & GenericDescriptionProps

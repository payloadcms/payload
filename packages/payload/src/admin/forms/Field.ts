import type { MarkOptional } from 'ts-essentials'

import type { User } from '../../auth/types.js'
import type { Locale, ServerProps } from '../../config/types.js'
import type { ClientField, Field, Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { FieldSlots, RenderedFieldMap } from '../types.js'
import type { FieldDescriptionServerProps } from './Description.js'
import type { FieldErrorServerProps } from './Error.js'
import type { FormField } from './Form.js'
import type { FieldLabelServerProps } from './Label.js'

export type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type ClientFieldBase<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  readonly field: TFieldClient
  readonly renderedFieldMap?: RenderedFieldMap
} & FieldSlots &
  FormFieldBase

export type ServerFieldBase<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  readonly clientField: TFieldClient
  readonly descriptionProps?: FieldDescriptionServerProps<TFieldServer, TFieldClient>
  readonly errorProps?: FieldErrorServerProps<TFieldServer, TFieldClient>
  readonly field: TFieldServer
  readonly fieldState?: FormField
  readonly labelProps?: FieldLabelServerProps<TFieldServer, TFieldClient>
  readonly renderedFieldMap?: RenderedFieldMap
} & FormFieldBase &
  Partial<ServerProps>

export type SchemaAccessor = {
  /**
   * The unique identifier for the field in the schema, combining the schema path and the field index, e.g. `my-posts.my-array.text_index-2`
   */
  fieldKey: string
  /**
   * The dot-notated index path to the field in the schema, e.g. `0.1.2`
   */
  indexPath: string
  /**
   * The path by which the index path is in related to, e.g. `my-posts`
   */
  initialSchemaPath: string
  /**
   * The dot-notated path to the field in the schema, e.g. `my-posts.my-array.text`
   */
  schemaPath: string
}

export type FormFieldBase = {
  readonly Blocks?: React.ReactNode[]
  readonly docPreferences?: DocumentPreferences
  /**
   * `forceRender` is added by RenderField automatically.
   */
  readonly forceRender?: boolean
  readonly locale?: Locale
  /**
   * `readOnly` is added by RenderField automatically. This should be used instead of `field.admin.readOnly`.
   */
  readonly readOnly?: boolean
  readonly schemaAccessor: SchemaAccessor
  readonly user?: User
  readonly validate?: Validate
}

export type FieldClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
  AdditionalProps extends Record<string, unknown> = Record<string, unknown>,
> = React.ComponentType<AdditionalProps & ClientFieldBase<TFieldClient>>

export type FieldServerComponent<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
  AdditionalProps extends Record<string, unknown> = Record<string, unknown>,
> = React.ComponentType<AdditionalProps & ServerFieldBase<TFieldServer, TFieldClient>>

import type { MarkOptional } from 'ts-essentials'

import type { User } from '../../auth/types.js'
import type { Locale, ServerProps } from '../../config/types.js'
import type { ClientField, Field, Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { FieldSlots } from '../types.js'
import type { FieldDescriptionServerProps } from './Description.js'
import type { FieldErrorServerProps } from './Error.js'
import type { FormField } from './Form.js'
import type { FieldLabelServerProps } from './Label.js'

export type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type ClientFieldBase<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  readonly field: TFieldClient
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
} & FormFieldBase &
  Partial<ServerProps>

export type FormFieldBase = {
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

import type { I18nClient } from '@payloadcms/translations'
import type { MarkOptional } from 'ts-essentials'

import type { FieldPermissions } from '../../auth/types.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { ClientBlock, ClientField, Field } from '../../fields/config/types.js'
import type { Payload } from '../../types/index.js'
import type { ClientTab, FieldSchemaMap, FormField, FormState, RenderedField } from '../types.js'

export type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type ClientComponentProps = {
  field: ClientBlock | ClientField | ClientTab
  fieldState: FormField
  forceRender?: boolean
  indexPath: string
  parentPath: string
  parentSchemaPath: string
  path: string
  permissions: FieldPermissions
  readOnly?: boolean
  renderedBlocks?: RenderedField[]
  rowLabels?: React.ReactNode[]
  schemaPath: string
}

export type ServerComponentProps = {
  config: SanitizedConfig
  /**
   * The fieldSchemaMap that is created before form state is built is made available here.
   */
  fieldSchemaMap: FieldSchemaMap
  /**
   * Server Components will also have available to the entire form state.
   * We cannot add it to ClientComponentProps as that would blow up the size of the props sent to the client.
   */
  formState: FormState
  i18n: I18nClient
  payload: Payload
  serverField: Field
}

export type ClientFieldBase<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  readonly field: TFieldClient
} & Omit<ClientComponentProps, 'field'>

export type ServerFieldBase<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  readonly clientField: TFieldClient
  readonly field: TFieldServer
} & Omit<ClientComponentProps, 'field'> &
  Omit<ServerComponentProps, 'clientField' | 'field'>

export type FieldClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
  AdditionalProps extends Record<string, unknown> = Record<string, unknown>,
> = React.ComponentType<AdditionalProps & ClientFieldBase<TFieldClient>>

export type FieldServerComponent<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
  AdditionalProps extends Record<string, unknown> = Record<string, unknown>,
> = React.ComponentType<AdditionalProps & ServerFieldBase<TFieldServer, TFieldClient>>

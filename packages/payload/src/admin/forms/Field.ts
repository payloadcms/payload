import type { I18nClient } from '@payloadcms/translations'
import type { MarkOptional } from 'ts-essentials'

import type { SanitizedFieldPermissions } from '../../auth/types.js'
import type { ClientBlock, ClientField, Field } from '../../fields/config/types.js'
import type { FieldPaths, ParentFieldPaths } from '../../fields/getFieldPaths.js'
import type { TypedUser } from '../../index.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { Operation, Payload, PayloadRequest } from '../../types/index.js'
import type {
  ClientFieldSchemaMap,
  ClientTab,
  Data,
  FieldSchemaMap,
  FormField,
  FormState,
  RenderedField,
} from '../types.js'

export type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>

export type ClientComponentProps = {
  customComponents?: FormField['customComponents']
  field: ClientBlock | ClientField | ClientTab
  /**
   * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
   *
   * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
   *
   * If a number is provided, will immediately render fields _up to that index_.
   */
  forceRender?: boolean
  permissions?: SanitizedFieldPermissions
  readOnly?: boolean
  renderedBlocks?: RenderedField[]
} & MarkOptional<Pick<FieldPaths, 'schemaPath'>, 'schemaPath'>

/**
 * Props required of all field components, as it relates to field paths.
 * Evaluates to `{ path: string, indexPath?: string, parentPath?: string, parentSchemaPath?: string }`.
 */
export type FieldPathProps = MarkOptional<Pick<FieldPaths, 'indexPath' | 'path'>, 'indexPath'> &
  MarkOptional<
    Pick<ParentFieldPaths, 'parentPath' | 'parentSchemaPath'>,
    'parentPath' | 'parentSchemaPath'
  >

/**
 * TODO: This should be renamed to `FieldComponentServerProps` or similar
 */
export type ServerComponentProps = {
  clientField: ClientFieldWithOptionalType
  clientFieldSchemaMap: ClientFieldSchemaMap
  collectionSlug: string
  data: Data
  field: Field
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
  id?: number | string
  operation: Operation
  payload: Payload
  permissions: SanitizedFieldPermissions
  preferences: DocumentPreferences
  req: PayloadRequest
  siblingData: Data
  user: TypedUser
  value?: unknown
}

export type ClientFieldBase<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = {
  readonly field: TFieldClient
} & Omit<ClientComponentProps, 'customComponents' | 'field'>

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

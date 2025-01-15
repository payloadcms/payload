import type { I18nClient } from '@payloadcms/translations'
import type { MarkOptional } from 'ts-essentials'

import type { SanitizedFieldPermissions, User } from '../../auth/types.js'
import type { ClientBlock, ClientField, Field } from '../../fields/config/types.js'
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
  forceRender?: boolean
  permissions?: SanitizedFieldPermissions
  readOnly?: boolean
  renderedBlocks?: RenderedField[]
  /**
   * Used to extract field configs from a schemaMap.
   * Does not include indexes.
   *
   * @default field.name
   **/
  schemaPath?: string
}

// TODO: maybe we can come up with a better name?
export type FieldPaths = {
  /**
   * @default ''
   */
  indexPath?: string
  /**
   * @default ''
   */
  parentPath?: string
  /**
   * The path built up to the point of the field
   * excluding the field name.
   *
   * @default ''
   */
  parentSchemaPath?: string
  /**
   * A built up path to access FieldState in the form state.
   * Nested fields will have a path that includes the parent field names
   * if they are nested within a group, array, block or named tab.
   *
   * Collapsibles and unnamed tabs will have arbitrary paths
   * that look like _index-0, _index-1, etc.
   *
   * Row fields will not have a path.
   *
   * @example 'parentGroupField.childTextField'
   *
   * @default field.name
   */
  path: string
}

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
  user: User
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

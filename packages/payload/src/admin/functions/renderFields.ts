import type { I18nClient } from '@payloadcms/translations'

import type { FieldPermissions } from '../../auth/types.js'
import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { ClientCollectionConfig } from '../../collections/config/client.js'
import type { ClientConfig } from '../../config/client.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { ClientField, Field } from '../../fields/config/types.js'
import type { ClientGlobalConfig } from '../../globals/config/client.js'
import type { Operation, Payload, PayloadRequest } from '../../types/index.js'
import type { FormState } from '../types.js'

export type RenderFieldsFn = (props: RenderFieldsArgs) => React.ReactNode[]

export type RenderFieldsClient = (
  args: Omit<RenderFieldsArgs, 'config' | 'importMap' | 'payload'>,
) => Promise<React.ReactNode[]>

export type RenderFieldFn = (args: RenderFieldArgs) => React.ReactNode

export type RenderFieldClient = (
  args: Omit<RenderFieldArgs, 'config' | 'importMap' | 'payload'>,
) => Promise<React.ReactNode>

export type RenderFieldsArgs = {
  readonly Blocks?: React.ReactNode[]
  readonly className?: string
  readonly clientCollectionConfig?: ClientCollectionConfig
  readonly clientConfig: ClientConfig
  readonly clientFields: ClientField[]
  readonly clientGlobalConfig?: ClientGlobalConfig
  readonly config: SanitizedConfig
  readonly fields: Field[]
  /**
   * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
   *
   * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
   *
   * If a number is provided, will immediately render fields _up to that index_.
   */
  readonly forceRender?: boolean | number
  readonly formState?: FormState
  readonly i18n: I18nClient
  readonly importMap: ImportMap
  readonly indexPath?: string
  readonly margins?: 'small' | false
  readonly operation?: Operation
  readonly path?: string
  readonly payload: Payload
  readonly permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readonly readOnly?: boolean
  readonly schemaPath?: string
}

export type RenderFieldArgs = {
  readonly className?: string
  readonly clientConfig: ClientConfig
  readonly clientField: ClientField
  readonly config: SanitizedConfig
  readonly field: Field
  readonly fieldPath: string
  readonly fieldPermissions: FieldPermissions
  readonly forceRender?: boolean
  readonly formState: FormState
  readonly i18n: I18nClient
  readonly importMap: ImportMap
  readonly indexPath: string
  readonly margins?: 'small' | false
  readonly path: string
  readonly payload: Payload
  readonly permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readonly readOnly?: boolean
  readonly renderFields: RenderFieldsFn
  readonly schemaPath: string
}

export type RenderFieldBySchemaPath = (
  args: {
    importMap: ImportMap
    req: PayloadRequest
    schemaPath: string
  } & Omit<RenderFieldArgs, 'config' | 'i18n' | 'importMap' | 'payload'>,
) => ReturnType<RenderFieldFn>

export type RenderFieldBySchemaPathClient = (args: {
  schemaPath: string
}) => ReturnType<RenderFieldFn>

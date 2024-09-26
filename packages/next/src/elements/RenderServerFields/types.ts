import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  ClientGlobalConfig,
  Field,
  FieldPermissions,
  FormState,
  ImportMap,
  Operation,
  Payload,
  SanitizedConfig,
} from 'payload'

export type Props = {
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

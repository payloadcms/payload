import type { I18nClient } from '@payloadcms/translations'

import type { ClientField, Field, FieldTypes, Tab } from '../../fields/config/types.js'
import type {
  ClientFieldWithOptionalType,
  PayloadRequest,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
} from '../../index.js'

export type VersionTab = {
  fields: VersionField[]
  name?: string
} & Pick<Tab, 'label'>

export type BaseVersionField = {
  CustomComponent?: React.ReactNode
  fields: VersionField[]
  path: string
  rows?: VersionField[][]
  schemaPath: string
  tabs?: VersionTab[]
  type: FieldTypes
}

export type VersionField = {
  field?: BaseVersionField
  fieldByLocale?: Record<string, BaseVersionField>
}

export type FieldDiffClientProps<TClientField extends ClientFieldWithOptionalType = ClientField> = {
  baseVersionField: BaseVersionField
  /**
   * @deprecated remove in 4.0. react-diff-viewer-continued is no longer a dependency
   */
  diffMethod: any
  field: TClientField
  /**
   * Permissions at this level of the field. If this field is unnamed, this will be `SanitizedFieldsPermissions` - if it is named, it will be `SanitizedFieldPermissions`
   */
  fieldPermissions: SanitizedFieldPermissions | SanitizedFieldsPermissions
  /**
   * If this field is localized, this will be the locale of the field
   */
  locale?: string
  nestingLevel?: number
  parentIsLocalized: boolean
  /**
   * Field value from the version being compared from
   */
  valueFrom: unknown
  /**
   * Field value from the version being compared to
   */
  valueTo: unknown
}

export type FieldDiffServerProps<
  TField extends Field = Field,
  TClientField extends ClientFieldWithOptionalType = ClientField,
> = {
  clientField: TClientField
  field: TField
  i18n: I18nClient
  req: PayloadRequest
  selectedLocales: string[]
} & Omit<FieldDiffClientProps, 'field'>

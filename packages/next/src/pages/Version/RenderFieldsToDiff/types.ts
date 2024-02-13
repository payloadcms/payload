import type { FieldPermissions } from 'payload/auth'
import { FieldMap, MappedField } from '@payloadcms/ui'
import { I18n } from '@payloadcms/translations/types'
import { FieldComponents } from './fields/types'

export type Props = {
  comparison: Record<string, any>
  fieldPermissions: Record<string, FieldPermissions>
  fieldMap: FieldMap
  locales: string[]
  version: Record<string, any>
  locale: string
  i18n: I18n
  fieldComponents: FieldComponents
}

export type FieldDiffProps = Props & {
  field: MappedField
}

import type { FieldPermissions } from 'payload/auth'
import type { Field, SanitizedConfig } from 'payload/types'
import type { FieldComponents } from './fields/types'
import type { I18n } from '@payloadcms/translations'

export type Props = {
  comparison: Record<string, any>
  fieldComponents: FieldComponents
  fieldPermissions: Record<string, FieldPermissions>
  fields: Field[]
  locales: string[]
  version: Record<string, any>
  i18n: I18n
  config: SanitizedConfig
  locale: string
}

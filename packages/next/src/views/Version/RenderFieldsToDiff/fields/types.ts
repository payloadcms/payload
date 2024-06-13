import type { I18nClient } from '@payloadcms/translations'
import type { FieldMap, MappedField } from '@payloadcms/ui/utilities/buildComponentMap'
import type { FieldPermissions } from 'payload'
import type React from 'react'
import type { DiffMethod } from 'react-diff-viewer-continued'

export type DiffComponents = Record<string, React.FC<Props>>

export type Props = {
  comparison: any
  diffComponents: DiffComponents
  diffMethod?: DiffMethod
  disableGutter?: boolean
  field: MappedField
  fieldMap: FieldMap
  i18n: I18nClient
  isRichText?: boolean
  locale?: string
  locales?: string[]
  permissions?: Record<string, FieldPermissions>
  version: any
}

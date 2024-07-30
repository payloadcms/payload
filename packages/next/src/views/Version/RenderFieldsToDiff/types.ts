import type { I18nClient } from '@payloadcms/translations'
import type { FieldMap, FieldPermissions, MappedField } from 'payload'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { DiffComponents } from './fields/types.js'

export type Props = {
  comparison: Record<string, any>
  diffComponents: DiffComponents
  fieldMap: FieldMap
  fieldPermissions: Record<string, FieldPermissions>
  i18n: I18nClient
  locales: string[]
  version: Record<string, any>
}

export type FieldDiffProps = {
  diffMethod: DiffMethod
  field: MappedField
  isRichText: boolean
} & Props

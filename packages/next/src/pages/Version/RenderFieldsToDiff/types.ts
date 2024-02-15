import type { FieldPermissions } from 'payload/auth'
import { FieldMap, MappedField } from '@payloadcms/ui'
import { I18n } from '@payloadcms/translations/types'
import { DiffComponents } from './fields/types'
import type { DiffMethod } from 'react-diff-viewer-continued'

export type Props = {
  comparison: Record<string, any>
  fieldPermissions: Record<string, FieldPermissions>
  fieldMap: FieldMap
  locales: string[]
  version: Record<string, any>
  i18n: I18n
  diffComponents: DiffComponents
}

export type FieldDiffProps = Props & {
  field: MappedField
  diffMethod: DiffMethod
  isRichText: boolean
}

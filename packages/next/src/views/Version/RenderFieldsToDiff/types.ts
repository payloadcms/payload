import type { I18n } from '@payloadcms/translations'
import type { FieldMap, MappedField } from '@payloadcms/ui'
import type { FieldPermissions } from 'payload/auth'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { DiffComponents } from './fields/types'

export type Props = {
  comparison: Record<string, any>
  diffComponents: DiffComponents
  fieldMap: FieldMap
  fieldPermissions: Record<string, FieldPermissions>
  i18n: I18n
  locales: string[]
  version: Record<string, any>
}

export type FieldDiffProps = Props & {
  diffMethod: DiffMethod
  field: MappedField
  isRichText: boolean
}

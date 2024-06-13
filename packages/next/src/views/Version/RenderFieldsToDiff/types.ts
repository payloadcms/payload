import type { I18nClient } from '@payloadcms/translations'
import type { FieldMap, MappedField } from '@payloadcms/ui/utilities/buildComponentMap'
import type { FieldPermissions } from 'payload'
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

export type FieldDiffProps = Props & {
  diffMethod: DiffMethod
  field: MappedField
  isRichText: boolean
}

import type { FieldPermissions, User } from 'payload/auth'
import type { Document, DocumentPreferences, Field } from 'payload/types'
import { Locale } from 'payload/config'
import { FieldMap, FieldMaps } from '../utilities/buildFieldMaps/types'

export type Props = {
  className?: string
  forceRender?: boolean
  margins?: 'small' | false
  data?: Document
  fieldMap: FieldMap
  docPreferences?: DocumentPreferences
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
  locale?: Locale
} & {
  filter?: (field: Field) => boolean
  indexPath?: string
  operation?: 'create' | 'update'
}

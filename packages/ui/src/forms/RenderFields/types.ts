import type { FieldPermissions, User } from 'payload/auth'
import type { Document, DocumentPreferences, Field } from 'payload/types'
import { FormState } from '../Form/types'
import { Locale } from 'payload/config'
import { buildFieldMap } from './buildFieldMap'

export type Props = {
  className?: string
  forceRender?: boolean
  margins?: 'small' | false
  data?: Document
  fieldMap: ReturnType<typeof buildFieldMap>
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

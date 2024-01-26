import type { FieldPermissions, User } from 'payload/auth'
import type { Document, DocumentPreferences, Field } from 'payload/types'
import { FormState } from '../Form/types'
import { Locale } from 'payload/config'
import { createFieldMap } from './createFieldMap'

export type Props = {
  className?: string
  forceRender?: boolean
  margins?: 'small' | false
  data?: Document
  fieldMap: ReturnType<typeof createFieldMap>
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

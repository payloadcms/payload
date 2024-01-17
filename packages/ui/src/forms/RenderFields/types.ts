import type { FieldPermissions, User } from 'payload/auth'
import type { Document, DocumentPreferences, Field, FieldWithPath, Payload } from 'payload/types'
import type { ReducedField } from './filterFields'
import { FormState } from '../Form/types'
import { FieldTypes } from 'payload/config'
import { I18n } from '@payloadcms/translations'

export type Props = {
  className?: string
  fieldTypes: FieldTypes
  forceRender?: boolean
  margins?: 'small' | false
  data?: Document
  formState: FormState
  user: User
  docPreferences?: DocumentPreferences
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
  i18n: I18n
  payload: Payload
} & (
  | {
      // FormState to be filtered by the component
      fieldSchema: FieldWithPath[]
      filter?: (field: Field) => boolean
      indexPath?: string
      operation?: 'create' | 'update'
    }
  | {
      // Pre-filtered fields to be simply rendered
      fields: ReducedField[]
    }
)

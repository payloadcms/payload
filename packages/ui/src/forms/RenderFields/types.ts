import type { FieldPermissions, User } from 'payload/auth'
import type { Document, Field, FieldWithPath } from 'payload/types'
import type { ReducedField } from './filterFields'
import { Fields } from '../Form/types'
import { FieldTypes } from 'payload/config'

export type Props = {
  className?: string
  fieldTypes: FieldTypes
  forceRender?: boolean
  margins?: 'small' | false
  data?: Document
  state: Fields
  user: User
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
} & (
  | {
      // Fields to be filtered by the component
      fieldSchema: FieldWithPath[]
      filter?: (field: Field) => boolean
      indexPath?: string
    }
  | {
      // Pre-filtered fields to be simply rendered
      fields: ReducedField[]
    }
)

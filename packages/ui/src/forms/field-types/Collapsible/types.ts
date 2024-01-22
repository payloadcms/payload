import type { FieldTypes } from 'payload/config'
import type { FieldPermissions } from 'payload/auth'
import type { CollapsibleField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<CollapsibleField, 'type'> & {
    fieldTypes: FieldTypes
    indexPath: string
    permissions: FieldPermissions
  }

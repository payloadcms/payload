import type { FieldTypes } from 'payload/config'
import type { FieldPermissions } from 'payload/auth'
import type { GroupField } from 'payload/types'
import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<GroupField, 'type'> & {
    fieldTypes: FieldTypes
    forceRender?: boolean
    indexPath: string
    permissions: FieldPermissions
    value: Record<string, unknown>
  }

import type { FieldMap, ReducedBlock } from '@payloadcms/ui'
import type { FieldPermissions } from 'payload/auth'
import type { BlockField, FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type BlocksFieldProps = FormFieldBase & {
  blocks?: ReducedBlock[]
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  label?: FieldBase['label']
  labels?: BlockField['labels']
  maxRows?: number
  minRows?: number
  name?: string
  permissions: FieldPermissions
  slug?: string
  width?: string
}

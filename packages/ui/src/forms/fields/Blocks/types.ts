import type { ReducedBlock } from '@payloadcms/ui'
import type { FieldPermissions } from 'payload/auth'
import type { BlockField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type BlocksFieldProps = FormFieldBase & {
  blocks?: ReducedBlock[]
  forceRender?: boolean
  indexPath: string
  labels?: BlockField['labels']
  maxRows?: BlockField['maxRows']
  minRows?: BlockField['minRows']
  name?: string
  permissions: FieldPermissions
  slug?: string
}

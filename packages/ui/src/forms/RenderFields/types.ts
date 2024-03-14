import type { FieldPermissions, Operation } from 'payload/types'

import type { FieldMap } from '../../utilities/buildComponentMap/types.js'

export type Props = {
  className?: string
  fieldMap: FieldMap
  forceRender?: boolean
  margins?: 'small' | false
  operation?: Operation
  path: string
  permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readOnly: boolean
  schemaPath: string
}

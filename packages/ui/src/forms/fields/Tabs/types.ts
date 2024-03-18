import type { FieldPermissions } from 'payload/auth'

import type { FieldMap, MappedTab } from '../../../utilities/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared.js'

export type TabsFieldProps = FormFieldBase & {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  name?: string
  path?: string
  permissions: FieldPermissions
  tabs?: MappedTab[]
  width?: string
}

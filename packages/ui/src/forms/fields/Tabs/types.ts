import type { FieldPermissions } from 'payload/auth'

import type { MappedTab } from '../../../utilities/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared.js'

export type Props = FormFieldBase & {
  forceRender?: boolean
  indexPath: string
  name?: string
  path?: string
  permissions: FieldPermissions
  tabs?: MappedTab[]
}

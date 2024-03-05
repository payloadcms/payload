import type { Operation } from 'payload/types'

import type { FieldMap } from '../../utilities/buildComponentMap/types'

export type Props = {
  className?: string
  fieldMap: FieldMap
  forceRender?: boolean
  margins?: 'small' | false
  operation?: Operation
}

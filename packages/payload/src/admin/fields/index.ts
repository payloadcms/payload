import type { ClientField } from '../../fields/config/types.js'

export type FilterFields = (args: {
  field: ClientField
  parentPath: string
  path: string
}) => boolean

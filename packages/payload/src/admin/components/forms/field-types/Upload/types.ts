import type { UploadField } from '../../../../../fields/config/types.js'
import type { FieldTypes } from '../index.js'

export type Props = Omit<UploadField, 'type'> & {
  fieldTypes: FieldTypes
  path?: string
}

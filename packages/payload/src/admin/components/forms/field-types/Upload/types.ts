import type { FieldTypes } from '..'
import type { UploadField } from '../../../../../fields/config/types'

export type Props = Omit<UploadField, 'type'> & {
  fieldTypes: FieldTypes
  path?: string
}

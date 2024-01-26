import type { NumberField } from 'payload/types'
import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  path?: string
  name?: string
}

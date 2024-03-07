import type { FormFieldBase } from '../shared.js'

export type Props = FormFieldBase & {
  autoComplete?: string
  name?: string
  path?: string
}

import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  path?: string
  name?: string
  autoComplete?: string
}

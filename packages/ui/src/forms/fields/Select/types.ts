import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  path?: string
  value?: string
  name?: string
  onChange?: (e: string) => void
}

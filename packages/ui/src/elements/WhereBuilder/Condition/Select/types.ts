import type { Operator, Option } from 'payload/bundle'

export type Props = {
  disabled?: boolean
  onChange: (val: string) => void
  operator: Operator
  options: Option[]
  value: string
}

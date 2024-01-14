import type { Option, Operator } from 'payload/types'

export type Props = {
  disabled?: boolean
  onChange: (val: string) => void
  operator: Operator
  options: Option[]
  value: string
}

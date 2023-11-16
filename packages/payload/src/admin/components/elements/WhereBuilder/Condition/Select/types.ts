import type { Option } from '../../../../../../fields/config/types'
import type { Operator } from '../../../../../../types'

export type Props = {
  disabled?: boolean
  onChange: (val: string) => void
  operator: Operator
  options: Option[]
  value: string
}

import type { Operator } from '../../../../../../types'

export type Props = {
  disabled?: boolean
  onChange: (val: string) => void
  operator: Operator
  value: string | string[]
}

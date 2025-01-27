import type { Operator } from '../../../../../../types'

export type Props = {
  disabled?: boolean
  onChange: (e: string) => void
  operator: Operator
  value: number | number[]
}

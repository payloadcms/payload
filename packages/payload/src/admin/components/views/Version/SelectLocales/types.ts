import type { Option } from '../../../elements/ReactSelect/types'

export type Props = {
  onChange: (options: Option[]) => void
  options: Option[]
  value: Option[]
}

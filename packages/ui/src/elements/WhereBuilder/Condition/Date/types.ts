import type { Props as DateType } from '../../../../../components/elements/DatePicker/types'
export type Props = {
  admin?: {
    date?: DateType
  }
  disabled?: boolean
  onChange: () => void
  value: Date
}

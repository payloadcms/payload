import type { Props as DateType } from '../../../../elements/DatePicker/types.js'

export type Props = {
  admin?: {
    date?: DateType
  }
  disabled?: boolean
  onChange: () => void
  value: Date
}

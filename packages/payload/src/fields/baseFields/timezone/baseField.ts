import type { StaticLabel } from '../../../config/types.js'
import type { SelectField } from '../../config/types.js'

export const baseTimezoneField: (
  args: { label?: StaticLabel } & Partial<SelectField>,
) => SelectField = ({ name, defaultValue, label, options, required }) => {
  return {
    name: name!,
    type: 'select',
    admin: {
      hidden: true,
    },
    defaultValue,
    label,
    options: options!,
    required,
  }
}

import type { SelectField } from '../../config/types.js'

export const baseTimezoneField: (args: Partial<SelectField>) => SelectField = ({
  name,
  defaultValue,
  options,
  required,
}) => {
  return {
    name: name!,
    type: 'select',
    admin: {
      hidden: true,
    },
    defaultValue,
    options: options!,
    required,
  }
}

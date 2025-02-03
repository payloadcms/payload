import type { SelectField } from '../../config/types.js'

import { supportedTimezones } from './supportedTimezones.js'

export const baseTimezoneField: (args: Partial<SelectField>) => SelectField = ({
  name,
  defaultValue,
}) => {
  return {
    name,
    type: 'select',
    admin: {
      hidden: true,
    },
    defaultValue,
    options: supportedTimezones,
  }
}

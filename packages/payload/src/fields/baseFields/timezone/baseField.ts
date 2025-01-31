import type { SelectField } from '../../config/types.js'

import { timezoneOptions } from './timezoneOptions.js'

export const baseTimezoneField: (args: Partial<SelectField>) => SelectField = ({ name }) => {
  return {
    name,
    type: 'select',
    admin: {
      hidden: true,
    },
    defaultValue: 'UTC',
    options: timezoneOptions,
  }
}

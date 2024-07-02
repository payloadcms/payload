import type { Field } from '../../fields/config/types.js'

import { email } from '../../fields/validations.js'

export default (field: string): Field[] => {
  const formattedFields = [
    {
      name: 'email',
      type: 'email',
      admin: {
        components: {
          Field: field === 'username' ? undefined : () => null,
        },
      },
      label: ({ t }) => t('general:email'),
      required: true,
      unique: field === 'email' ? true : false,
      validate: email,
    },
  ] as Field[]

  if (field === 'username') {
    formattedFields.push({
      name: 'username',
      type: 'text',
      admin: {
        components: {
          Field: () => null,
        },
      },
      label: ({ t }) => t('authentication:username'),
      required: true,
      unique: true,
    } as Field)
  }

  return formattedFields
}

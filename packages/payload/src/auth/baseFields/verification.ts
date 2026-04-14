import type { Field, FieldHook } from '../../fields/config/types.js'

import { defaultAccess } from '../defaultAccess.js'

const autoRemoveVerificationToken: FieldHook = ({ data, operation, originalDoc, value }) => {
  // If a user manually sets `_verified` to true,
  // and it was `false`, set _verificationToken to `null`.
  // This is useful because the admin panel
  // allows users to set `_verified` to true manually

  if (operation === 'update') {
    if (data?._verified === true && originalDoc?._verified === false) {
      return null
    }
  }

  return value
}

export const verificationFields: Field[] = [
  {
    name: '_verified',
    type: 'checkbox',
    access: {
      create: defaultAccess,
      read: defaultAccess,
      update: defaultAccess,
    },
    admin: {
      components: {
        Field: false,
      },
    },
    label: ({ t }) => t('authentication:verified'),
  },
  {
    name: '_verificationToken',
    type: 'text',
    access: {
      create: () => false,
      update: () => false,
    },
    hidden: true,
    hooks: {
      beforeChange: [autoRemoveVerificationToken],
    },
  },
] as Field[]

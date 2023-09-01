import type { Field, FieldHook } from '../../fields/config/types'

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

export default [
  {
    access: {
      create: ({ req: { user } }) => Boolean(user),
      read: ({ req: { user } }) => Boolean(user),
      update: ({ req: { user } }) => Boolean(user),
    },
    admin: {
      components: {
        Field: () => null,
      },
    },
    name: '_verified',
    type: 'checkbox',
  },
  {
    hidden: true,
    hooks: {
      beforeChange: [autoRemoveVerificationToken],
    },
    name: '_verificationToken',
    type: 'text',
  },
] as Field[]

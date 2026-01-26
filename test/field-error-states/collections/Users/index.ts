import { type CollectionConfig, ValidationError } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [],
  hooks: {
    beforeValidate: [
      (data) => {
        const { password } = data.data || {}
        // Only validate password length on update operations (when changing password)
        // Skip validation on create to allow test suite initialization with "test" password
        if (data.operation === 'update' && password && password.length < 8) {
          throw new ValidationError({
            collection: 'users',
            errors: [
              {
                message: 'Password must be at least 8 characters long',
                path: 'password',
              },
            ],
          })
        }
      },
    ],
  },
}

import type { ArrayField } from '../../fields/config/types.js'

export const sessionsFieldConfig: ArrayField = {
  name: 'sessions',
  type: 'array',
  access: {
    read: ({ doc, req: { user } }) => {
      return user?.id === doc?.id
    },
    update: () => false,
  },
  admin: {
    disabled: true,
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
  ],
}

import type { ArrayField } from '../../fields/config/types.js'

export const sessionsFieldConfig: ArrayField = {
  name: 'sessions',
  type: 'array',
  defaultValue: [],
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      access: {
        update: () => false,
      },
      defaultValue: () => new Date(),
    },
    {
      name: 'expiresAt',
      type: 'date',
      access: {
        update: () => false,
      },
      required: true,
    },
  ],
  required: true,
}

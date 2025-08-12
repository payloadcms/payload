import type { Field } from 'payload'

export const roles: Field = {
  name: 'roles',
  type: 'select',
  hasMany: true,
  options: [
    {
      label: 'Admin',
      value: 'admin',
    },
    {
      label: 'Editor',
      value: 'editor',
    },
    {
      label: 'User',
      value: 'user',
    },
  ],
}

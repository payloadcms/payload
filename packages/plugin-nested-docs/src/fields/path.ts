import type { TextField } from 'payload/types'

export const createPathField = (
  overrides?: Partial<
    TextField & {
      hasMany: false
    }
  >,
): TextField => ({
  name: 'path',
  type: 'text',
  index: true,
  unique: true,
  ...(overrides || {}),
  admin: {
    position: 'sidebar',
    readOnly: true,
    ...(overrides?.admin || {}),
  },
})

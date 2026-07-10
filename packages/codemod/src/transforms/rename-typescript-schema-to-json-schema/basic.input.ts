import type { Field } from 'payload'

export const tags: Field = {
  name: 'tags',
  type: 'json',
  typescriptSchema: [() => ({ type: 'array', items: { type: 'string' } })],
}

export const fields: Field[] = [
  {
    name: 'meta',
    type: 'json',
    typescriptSchema: [() => ({ type: 'object' })],
  },
]

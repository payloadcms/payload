import type { Field } from 'payload'

export const title: Field = {
  name: 'title',
  type: 'text',
}

// `typescriptVersion` is a near-miss — only the exact `typescriptSchema` key should match.
export const meta = {
  custom: {
    typescriptVersion: '5.5.0',
  },
}

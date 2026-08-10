import type { Field } from 'payload'

// A sibling `jsonSchema` already exists — the transform must not clobber it,
// and leaves the deprecated `typescriptSchema` key untouched for manual review.
export const tags: Field = {
  name: 'tags',
  type: 'json',
  jsonSchema: [() => ({ type: 'array' })],
  typescriptSchema: [() => ({ type: 'string' })],
}

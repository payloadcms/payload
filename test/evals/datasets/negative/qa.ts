import type { EvalCase } from '../../types.js'

export const negativeQADataset: EvalCase[] = [
  {
    input: 'What is wrong with the access control in this config?',
    expected:
      'The read access function returns a string ("yes" or "no") instead of a boolean or a Payload where-constraint object. Access control functions must return a boolean (true/false) or a where-constraint object to filter results.',
    category: 'negative',
    fixturePath: 'negative/codegen/invalid-access-return',
  },
  {
    input: 'What is wrong with the beforeChange hook in this config?',
    expected:
      'The beforeChange hook mutates the data object but does not return it. Payload requires beforeChange hooks to explicitly return the data object, otherwise the mutations are silently discarded and the document is saved with the original unchanged data.',
    category: 'negative',
    fixturePath: 'negative/codegen/missing-beforechange-return',
  },
  {
    input: 'What is wrong with the field definition in this config?',
    expected:
      "'not-a-real-type' is not a valid Payload field type. Valid field types include: text, textarea, number, checkbox, select, relationship, richText, array, group, blocks, date, email, upload.",
    category: 'negative',
    fixturePath: 'negative/codegen/invalid-field-type',
  },
]

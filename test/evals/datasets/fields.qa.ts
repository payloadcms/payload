import type { EvalCase } from '../types.js'

export const fieldsQADataset: EvalCase[] = [
  {
    input: 'What two properties are required on every Payload field?',
    expected: 'type (the field type string) and name (the field identifier)',
    category: 'fields',
  },
  {
    input:
      'What Payload field type would you use to store a reference to another collection document?',
    expected:
      'the relationship field type, with a relationTo property set to the target collection slug',
    category: 'fields',
  },
  {
    input:
      'How do you allow a relationship field to reference documents from multiple collections?',
    expected:
      'set relationTo to an array of collection slugs instead of a single string; the stored value will include a relationTo discriminator alongside the document id',
    category: 'fields',
  },
  {
    input:
      'What is the difference between the array field type and the blocks field type in Payload?',
    expected:
      'array fields have a fixed set of sub-fields repeated for each item; blocks fields allow each item to be a different block type, each with its own slug and fields',
    category: 'fields',
  },
  {
    input:
      'How do you conditionally show or hide a field in the Payload admin UI based on the value of another field?',
    expected:
      'use admin.condition, a function that receives (data, siblingData) and returns a boolean — the field is shown when it returns true',
    category: 'fields',
  },
  {
    input: 'How do you add a custom validation function to a Payload field?',
    expected:
      'add a validate property — a function that receives (value, { data, operation, req }) and returns true if valid or an error string if invalid',
    category: 'fields',
  },
  {
    input:
      'What Payload field type would you use to let editors build flexible page layouts from reusable content blocks?',
    expected:
      'the blocks field type, where each block is defined with a slug and fields array; editors can add, reorder, and mix different block types',
    category: 'fields',
  },
]

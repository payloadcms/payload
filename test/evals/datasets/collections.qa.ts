import type { EvalCase } from '../types.js'

export const collectionsQADataset: EvalCase[] = [
  {
    input: 'What is the minimum required property to define a Payload collection?',
    expected: 'a slug string that uniquely identifies the collection',
    category: 'collections',
  },
  {
    input: 'How do you make a Payload collection only readable by authenticated users?',
    expected:
      'define an access object with a read function that checks req.user, returning true only when req.user exists',
    category: 'collections',
  },
  {
    input:
      'In a Payload collection, where do you define logic that runs before a document is saved?',
    expected:
      'in the hooks object, inside the beforeChange array — each entry is an async function that receives { data, req, operation } and returns the modified data',
    category: 'collections',
  },
  {
    input: 'How do you add a custom label (singular and plural) to a Payload collection?',
    expected:
      'add a labels object with singular and plural string properties to the CollectionConfig',
    category: 'collections',
  },
  {
    input:
      'How do you configure which field is used as the title in the Payload admin UI list view?',
    expected:
      'set admin.useAsTitle to the name of the field you want displayed as the title in the list view',
    category: 'collections',
  },
  {
    input: 'How do you enable versioning on a Payload collection?',
    expected:
      'add a versions property to the collection config; set it to true for basic versioning, or an object with drafts: true to enable draft/publish workflow',
    category: 'collections',
  },
  {
    input:
      'What is the difference between a beforeChange hook and a beforeOperation hook in a Payload collection?',
    expected:
      'beforeChange runs just before a document is created or updated and can modify the data; beforeOperation runs before the database operation begins and receives the args before any processing',
    category: 'collections',
  },
]

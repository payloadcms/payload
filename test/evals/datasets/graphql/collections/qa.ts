import type { EvalCase } from '../../../types.js'

export const graphqlCollectionsQADataset: EvalCase[] = [
  {
    input: 'What is the default URL for the Payload GraphQL endpoint, and how can it be changed?',
    expected:
      'The default endpoint is /api/graphql; it can be customized by setting the routes property in the Payload config',
    category: 'graphql',
  },
  {
    input:
      'How does Payload generate GraphQL query and type names from a collection config, and what is an example?',
    expected:
      'Payload uses the collection\'s label with special characters and spaces removed; for a collection with slug "public-users" and label "Public User", findByID becomes PublicUser, find becomes PublicUsers, and count becomes countPublicUsers',
    category: 'graphql',
  },
  {
    input: 'What GraphQL queries does Payload automatically generate for each collection?',
    expected:
      '{CollectionLabel} for findByID, {CollectionLabels} for find, count{CollectionLabels} for count; auth-enabled collections also get me{Label}',
    category: 'graphql',
  },
  {
    input: 'What GraphQL mutations does Payload automatically generate for each collection?',
    expected:
      'create{Label}, update{Label}, delete{Label}; auth-enabled collections also get login{Label}, logout{Label}, forgotPassword{Label}, resetPassword{Label}, unlock{Label}, verifyEmail{Label}',
    category: 'graphql',
  },
  {
    input: 'What is one operation that is available via the Payload REST API but NOT via GraphQL?',
    expected:
      'File uploads — uploading files is only supported through the REST API; the GraphQL API does not support multipart file uploads',
    category: 'graphql',
  },
  {
    input:
      'How do you set a maximum query complexity limit in the Payload GraphQL API to prevent abuse?',
    expected:
      'Set graphQL.maxComplexity to a number in the Payload config; requests whose computed complexity exceeds this value are rejected',
    category: 'graphql',
  },
  {
    input:
      'What is the default behavior of the GraphQL Playground in production, and how do you change it?',
    expected:
      'The playground is disabled in production by default (graphQL.disablePlaygroundInProduction defaults to true); set it to false to enable the playground in production',
    category: 'graphql',
  },
  {
    input:
      'What GraphQL query and mutation are auto-generated for a Payload Global, and what are they named?',
    expected:
      'A query named {GlobalLabel} for findOne (e.g. Header for a global with slug "header"), and a mutation named update{GlobalLabel} for updates (e.g. updateHeader)',
    category: 'graphql',
  },
]

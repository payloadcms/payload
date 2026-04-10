import type { EvalCase } from '../../../types.js'

export const localApiCollectionsQADataset: EvalCase[] = [
  {
    input: 'What are the two ways to access the Payload Local API, and when would you use each?',
    expected:
      'Via req.payload inside hooks, access control functions, and other Payload callbacks where req is available; or via getPayload({ config }) imported from "payload" for use in server-side contexts like Next.js route handlers or React Server Components where req is not available',
    category: 'local-api',
  },
  {
    input:
      'What is the default value of overrideAccess in Payload Local API calls, and what does it mean?',
    expected:
      "overrideAccess defaults to true in Local API calls, meaning access control is bypassed and any operation is permitted; pass overrideAccess: false along with a user or req to enforce that user's access control rules",
    category: 'local-api',
  },
  {
    input: 'How do you query multiple documents from a collection using the Payload Local API?',
    expected:
      'payload.find({ collection: "slug", where: {...}, page, limit, depth, sort, locale }) — returns a paginated result object with docs, totalDocs, page, totalPages, etc.',
    category: 'local-api',
  },
  {
    input: 'How do you fetch a single document by ID using the Payload Local API?',
    expected:
      'payload.findByID({ collection: "slug", id, depth, locale }) — returns the document or throws if not found',
    category: 'local-api',
  },
  {
    input: 'How do you create a new document using the Payload Local API?',
    expected:
      'payload.create({ collection: "slug", data: { ...fields } }) — returns the newly created document',
    category: 'local-api',
  },
  {
    input:
      'How do you update a document by ID using the Local API, and how does bulk update differ?',
    expected:
      'Update by ID: payload.update({ collection, id, data }) — targets a single document; Bulk update: payload.update({ collection, where: {...}, data }) — updates all matching documents; both return the updated document(s)',
    category: 'local-api',
  },
  {
    input: 'How do you delete a document using the Local API, and how does bulk delete work?',
    expected:
      'Delete by ID: payload.delete({ collection, id }) — removes a single document; Bulk delete: payload.delete({ collection, where: {...} }) — removes all matching documents',
    category: 'local-api',
  },
  {
    input:
      'When calling the Local API with overrideAccess: false, what additional argument must you pass and why?',
    expected:
      "You must pass either user (a user object) or req (a PayloadRequest) so Payload knows which user's access control rules to apply; without it Payload cannot determine what the caller is permitted to do",
    category: 'local-api',
  },
]

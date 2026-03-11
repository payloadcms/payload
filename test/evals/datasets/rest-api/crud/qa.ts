import type { EvalCase } from '../../../types.js'

export const restApiCrudQADataset: EvalCase[] = [
  {
    input:
      'What are the eight CRUD operations available on a Payload collection via REST API, and what HTTP method and path does each use?',
    expected:
      'Find: GET /api/{slug}, Find By ID: GET /api/{slug}/{id}, Count: GET /api/{slug}/count, Create: POST /api/{slug}, Update: PATCH /api/{slug}, Update By ID: PATCH /api/{slug}/{id}, Delete: DELETE /api/{slug}, Delete By ID: DELETE /api/{slug}/{id}',
    category: 'rest-api',
  },
  {
    input:
      'What is the default base path for all Payload REST API routes, and how do you customize it?',
    expected:
      'The default base path is /api; it is customized via the routes.api property in the Payload config',
    category: 'rest-api',
  },
  {
    input: 'What casing format is required for collection slugs used in Payload REST API paths?',
    expected: 'Collection slugs must be formatted in kebab-case',
    category: 'rest-api',
  },
  {
    input:
      'What does the Payload REST API return from a Find operation on a collection (no filters applied)?',
    expected:
      'A paginated object with: docs (array of documents), totalDocs, limit, totalPages, page, pagingCounter, hasPrevPage, hasNextPage, prevPage, nextPage',
    category: 'rest-api',
  },
  {
    input:
      'How do you perform a bulk update on documents matching a filter using the Payload REST API?',
    expected:
      'Send PATCH /api/{collection-slug} with the update data in the request body and a where query parameter to filter which documents to update',
    category: 'rest-api',
  },
  {
    input:
      'How do you get a count of documents in a collection via the Payload REST API, and can the count be filtered?',
    expected:
      'Send GET /api/{collection-slug}/count; an optional where query parameter can be added to filter which documents are counted',
    category: 'rest-api',
  },
  {
    input:
      'What is the Payload HTTP method override feature, how do you use it, and when is it useful?',
    expected:
      'Send a POST request with the X-Payload-HTTP-Method-Override header set to GET and Content-Type of application/x-www-form-urlencoded; the body contains the query params as a URL-encoded string; useful when a GET query string would be too long for some clients or proxies',
    category: 'rest-api',
  },
  {
    input:
      'What Content-Type header should be used when creating or updating a document via the Payload REST API (no file upload)?',
    expected:
      'application/json; the request body should be a JSON-serialized object containing the document data',
    category: 'rest-api',
  },
]

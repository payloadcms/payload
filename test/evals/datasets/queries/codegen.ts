import type { CodegenEvalCase } from '../../types.js'

/**
 * Queries eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 *
 * Runtime call patterns (payload.find, REST fetch, etc.) are NOT config
 * modifications and are deferred — see 4-DEFERRED-EVAL-CASES.md ## QUERIES.
 * Only config-modifying cases (defaultDepth, defaultPopulate, graphQL options,
 * maxDepth, pagination limits) belong here.
 */
export const queriesCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Set the global defaultDepth to 1 so relationship fields are not eagerly populated across the whole application.',
    expected:
      'defaultDepth set to 1 at the top level of buildConfig so all API requests use depth 1 unless overridden',
    category: 'queries',
    fixturePath: 'queries/codegen/set-default-depth',
    assertions: [{ kind: 'configOption', path: 'defaultDepth', value: 1 }],
  },
  {
    input:
      'Configure defaultPopulate on the posts collection so that when it is populated from another document only the title and slug fields are returned — not the full document.',
    expected:
      'defaultPopulate added to the posts collection config with title: true and slug: true, so only those two fields are selected during population',
    category: 'queries',
    fixturePath: 'queries/codegen/add-defaultpopulate',
    assertions: [{ kind: 'collectionOption', slug: 'posts', path: 'defaultPopulate' }],
  },
  {
    input:
      'Limit the default pagination on the posts collection to 10 documents per page in the admin panel list view.',
    expected:
      'admin.pagination.defaultLimit set to 10 on the posts collection config so the admin list view pages by default at 10 docs',
    category: 'queries',
    fixturePath: 'queries/codegen/set-collection-pagination-limits',
    assertions: [
      { kind: 'collectionOption', slug: 'posts', path: 'admin.pagination.defaultLimit', value: 10 },
    ],
  },
  {
    input:
      'The audit-log collection is internal — disable its GraphQL exposure so it does not appear in the GraphQL schema at all.',
    expected:
      'graphQL set to false on the audit-log collection so it is excluded from the generated GraphQL schema',
    category: 'queries',
    fixturePath: 'queries/codegen/disable-graphql-on-collection',
    assertions: [{ kind: 'collectionOption', slug: 'audit-log', path: 'graphQL', value: false }],
  },
  {
    input:
      'The news collection auto-generates pluralised GraphQL type names but the default ("News" / "allNews") reads awkwardly. Configure singularName to "NewsItem" and pluralName to "NewsItems" so the generated queries are named accordingly.',
    expected:
      'graphQL.singularName set to "NewsItem" and graphQL.pluralName set to "NewsItems" on the news collection',
    category: 'queries',
    fixturePath: 'queries/codegen/set-graphql-singular-plural-name',
    assertions: [
      { kind: 'collectionOption', slug: 'news', path: 'graphQL.singularName', value: 'NewsItem' },
      { kind: 'collectionOption', slug: 'news', path: 'graphQL.pluralName', value: 'NewsItems' },
    ],
  },
  {
    input:
      'Add a custom GraphQL query named recentPosts to the Payload config that returns the 5 most recently published posts.',
    expected:
      'graphQL.queries function added (or updated) in buildConfig returning an object that includes a recentPosts key with a type, args, and resolve function; the resolver calls payload.find on the posts collection with depth: 0 and a limit',
    category: 'queries',
    fixturePath: 'queries/codegen/add-graphql-custom-query',
    // configOption checks that graphQL.queries is present in buildConfig
    assertions: [{ kind: 'configOption', path: 'graphQL.queries' }],
  },
  {
    input:
      'Set maxDepth: 1 on the author relationship field in the posts collection so it is never populated more than one level deep, regardless of the requested depth.',
    expected:
      'maxDepth: 1 added to the author field in the posts collection — this caps auto-population at depth 1 even when the query asks for more',
    category: 'queries',
    fixturePath: 'queries/codegen/set-relationship-maxDepth',
    assertions: [
      { kind: 'fieldOption', slug: 'posts', field: 'author', option: 'maxDepth', value: 1 },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'This config sets defaultLimit to 0 on the posts admin pagination, which loads every document in the collection on every admin list-view request — dangerous for large collections. Fix it to a sensible default of 50.',
    expected:
      'admin.pagination.defaultLimit changed from 0 to 50 (or another sensible positive integer) on the posts collection so the admin list view does not load all documents at once',
    category: 'queries',
    fixturePath: 'queries/codegen/fix-unlimited-pagination',
    assertions: [
      {
        kind: 'collectionOption',
        slug: 'posts',
        path: 'admin.pagination.defaultLimit',
        value: 50,
      },
    ],
  },
]

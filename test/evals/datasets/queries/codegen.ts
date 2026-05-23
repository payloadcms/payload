import type { CodegenEvalCase } from '../../types.js'

export const queriesCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  // docs-grounded: root-level defaultDepth not configured in any test/ config; documented at docs/queries/depth.mdx.
  {
    assertions: [{ kind: 'configOption', path: 'defaultDepth', value: 1 }],
    category: 'queries',
    expected:
      'defaultDepth set to 1 at the top level of buildConfig so all API requests use depth 1 unless overridden',
    fixturePath: 'queries/codegen/set-default-depth',
    input:
      'Set the global defaultDepth to 1 so relationship fields are not eagerly populated across the whole application.',
  },
  {
    assertions: [{ slug: 'posts', kind: 'collectionOption', path: 'defaultPopulate' }],
    category: 'queries',
    expected:
      'defaultPopulate added to the posts collection config with title: true and slug: true, so only those two fields are selected during population',
    fixturePath: 'queries/codegen/add-defaultpopulate',
    input:
      'Configure defaultPopulate on the posts collection so that when it is populated from another document only the title and slug fields are returned — not the full document.',
  },
  {
    assertions: [
      { slug: 'posts', kind: 'collectionOption', path: 'admin.pagination.defaultLimit', value: 10 },
    ],
    category: 'queries',
    expected:
      'admin.pagination.defaultLimit set to 10 on the posts collection config so the admin list view pages by default at 10 docs',
    fixturePath: 'queries/codegen/set-collection-pagination-limits',
    input:
      'Limit the default pagination on the posts collection to 10 documents per page in the admin panel list view.',
  },
  {
    assertions: [{ slug: 'audit-log', kind: 'collectionOption', path: 'graphQL', value: false }],
    category: 'queries',
    expected:
      'graphQL set to false on the audit-log collection so it is excluded from the generated GraphQL schema',
    fixturePath: 'queries/codegen/disable-graphql-on-collection',
    input:
      'The audit-log collection is internal — disable its GraphQL exposure so it does not appear in the GraphQL schema at all.',
  },
  // docs-grounded: graphQL.singularName/pluralName not configured in any test/ config; documented at docs/graphql/overview.mdx.
  {
    assertions: [
      { slug: 'news', kind: 'collectionOption', path: 'graphQL.singularName', value: 'NewsItem' },
      { slug: 'news', kind: 'collectionOption', path: 'graphQL.pluralName', value: 'NewsItems' },
    ],
    category: 'queries',
    expected:
      'graphQL.singularName set to "NewsItem" and graphQL.pluralName set to "NewsItems" on the news collection',
    fixturePath: 'queries/codegen/set-graphql-singular-plural-name',
    input:
      'The news collection auto-generates pluralised GraphQL type names but the default ("News" / "allNews") reads awkwardly. Configure singularName to "NewsItem" and pluralName to "NewsItems" so the generated queries are named accordingly.',
  },
  {
    category: 'queries',
    expected:
      'graphQL.queries function added (or updated) in buildConfig returning an object that includes a recentPosts key with a type, args, and resolve function; the resolver calls payload.find on the posts collection with depth: 0 and a limit',
    fixturePath: 'queries/codegen/add-graphql-custom-query',
    input:
      'Add a custom GraphQL query named recentPosts to the Payload config that returns the 5 most recently published posts.',
    // configOption checks that graphQL.queries is present in buildConfig
    assertions: [{ kind: 'configOption', path: 'graphQL.queries' }],
  },
  {
    assertions: [
      { slug: 'posts', field: 'author', kind: 'fieldOption', option: 'maxDepth', value: 1 },
    ],
    category: 'queries',
    expected:
      'maxDepth: 1 added to the author field in the posts collection — this caps auto-population at depth 1 even when the query asks for more',
    fixturePath: 'queries/codegen/set-relationship-maxDepth',
    input:
      'Set maxDepth: 1 on the author relationship field in the posts collection so it is never populated more than one level deep, regardless of the requested depth.',
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    assertions: [
      {
        slug: 'posts',
        kind: 'collectionOption',
        path: 'admin.pagination.defaultLimit',
        value: 50,
      },
    ],
    category: 'queries',
    expected:
      'admin.pagination.defaultLimit changed from 0 to 50 (or another sensible positive integer) on the posts collection so the admin list view does not load all documents at once',
    fixturePath: 'queries/codegen/fix-unlimited-pagination',
    input:
      'This config sets defaultLimit to 0 on the posts admin pagination, which loads every document in the collection on every admin list-view request — dangerous for large collections. Fix it to a sensible default of 50.',
  },
]

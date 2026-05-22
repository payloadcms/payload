import type { CodegenEvalCase } from '../../types.js'

/**
 * Migrations eval cases.
 *
 * Note on AST assertions: the assertion catalog covers collections, fields,
 * hooks, and access — not collection-level config properties like `versions`.
 * Cases involving `versions` rely on the OpenAI scorer rather than AST checks.
 * See MIGRATIONS.md for the deferred-cases rationale.
 */
export const migrationsCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Enable draft support on the posts collection so editors can save drafts before publishing.',
    expected:
      'versions property on the posts collection set to { drafts: true } — enabling draft support and the _status field',
    category: 'migrations',
    fixturePath: 'migrations/codegen/enable-drafts-posts',
    // versions is a collection-level property, not a field — only collectionExists is assertable
    assertions: [{ kind: 'collectionExists', slug: 'posts' }],
  },
  {
    input: 'Add version history to the posts collection so we can track changes over time.',
    expected:
      'versions property set on the posts collection — either versions: true or versions: { maxPerDoc: N } — enabling version tracking',
    category: 'migrations',
    fixturePath: 'migrations/codegen/enable-versions-posts',
    assertions: [{ kind: 'collectionExists', slug: 'posts' }],
  },
  {
    input:
      'Add an afterChange hook to the posts collection that logs an audit entry to the audit-log collection. Make sure the hook passes req so it runs inside the same transaction.',
    expected:
      'afterChange hook added to the posts collection; hook function calls payload.create (or req.payload.create) with collection: "audit-log" and passes req to maintain transaction context',
    category: 'migrations',
    fixturePath: 'migrations/codegen/add-migration-afterchange-hook',
    assertions: [{ hook: 'afterChange', kind: 'collectionHook', slug: 'posts' }],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'This config intends to enable draft support on the posts collection but the versions setting is wrong — it uses `versions: true` instead of `versions: { drafts: true }`. Fix it so drafts are properly enabled.',
    expected:
      'versions property on posts changed from `versions: true` to `versions: { drafts: true }` to correctly enable draft support and the _status field',
    category: 'migrations',
    fixturePath: 'migrations/codegen/fix-missing-versions-config',
    assertions: [{ kind: 'collectionExists', slug: 'posts' }],
  },
]

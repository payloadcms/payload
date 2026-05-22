import type { CodegenEvalCase } from '../../types.js'

/**
 * Migrations eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
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
    assertions: [{ kind: 'collectionOption', slug: 'posts', path: 'versions.drafts', value: true }],
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
    assertions: [{ kind: 'collectionOption', slug: 'posts', path: 'versions.drafts', value: true }],
  },
]

import type { CodegenEvalCase } from '../../types.js'

/**
 * Hooks eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 *
 * AST catalog gaps as of Task 7:
 * - `beforeDuplicate` is NOT in FieldHookName → deferred (see 4-DEFERRED-EVAL-CASES.md)
 * - Global hooks are not parsed by parseConfig.ts (only collections are scanned) → scorer-only
 * - Root-level `hooks.afterError` is addressable via `configOption { path: 'hooks.afterError' }`
 */
export const hooksCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input: 'Add a root-level afterError hook to the config that logs every error to the console.',
    expected:
      'hooks.afterError array added at the top-level buildConfig object; the hook function receives an error argument and calls console.error (or similar logging); the hook returns result',
    category: 'hooks',
    fixturePath: 'hooks/codegen/add-root-afterError-hook',
    assertions: [{ kind: 'configOption', path: 'hooks.afterError' }],
  },
  {
    input:
      'Add a beforeLogin hook to the users collection that throws a 403 APIError if the user has a isBanned field set to true.',
    expected:
      'beforeLogin hook added to the users collection hooks object; the hook checks user.isBanned and throws an APIError with HTTP status 403 if true; otherwise returns user',
    category: 'hooks',
    fixturePath: 'hooks/codegen/add-beforeLogin-hook',
    assertions: [{ kind: 'collectionHook', slug: 'users', hook: 'beforeLogin' }],
  },
  {
    input:
      'Add a beforeOperation hook to the posts collection that logs the operation name before each operation begins.',
    expected:
      'beforeOperation hook added to the posts collection hooks object; the hook receives args and operation, logs the operation name, and returns args',
    category: 'hooks',
    fixturePath: 'hooks/codegen/add-beforeOperation-hook',
    assertions: [{ kind: 'collectionHook', slug: 'posts', hook: 'beforeOperation' }],
  },
  {
    input:
      'Add an afterDelete hook to the posts collection that logs the deleted document id to the console.',
    expected:
      'afterDelete hook added to the posts collection hooks object; the hook receives id (and optionally doc) and logs the id',
    category: 'hooks',
    fixturePath: 'hooks/codegen/add-afterDelete-hook',
    assertions: [{ kind: 'collectionHook', slug: 'posts', hook: 'afterDelete' }],
  },
  {
    input:
      'Update the afterChange hook on the posts collection to use req.context.skipHooks to prevent an infinite loop when the hook calls payload.update on the same document.',
    expected:
      'afterChange hook body guards against re-entry by checking context.skipHooks (or similar flag) and passing context: { skipHooks: true } to the nested payload.update call',
    category: 'hooks',
    fixturePath: 'hooks/codegen/add-context-skipHooks-flag',
    // AST cannot verify the inside of a hook body — rely on scorer
    assertions: [],
  },
  {
    input:
      'Add a beforeChange hook to the header global that stamps an updatedAt field with the current date.',
    expected:
      'beforeChange hook added to the header global hooks object; the hook sets data.updatedAt to new Date() (or Date.now()) and returns data',
    category: 'hooks',
    fixturePath: 'hooks/codegen/add-global-beforeChange',
    // parseConfig.ts does not scan globals — scorer-only
    assertions: [],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'This config computes a virtual wordCount field in a collection-level afterRead hook. Move the computation to a field-level afterRead hook on the wordCount field instead.',
    expected:
      'collection-level afterRead hook that computes wordCount is removed (or reduced); a field-level afterRead hook is added on the wordCount field that computes its own value from doc.content (or similar)',
    category: 'hooks',
    fixturePath: 'hooks/codegen/field-level-vs-collection-level-fix',
    // The key assertion: the afterRead must end up on the FIELD, not the collection
    assertions: [{ kind: 'fieldHook', slug: 'posts', field: 'wordCount', hook: 'afterRead' }],
  },
]

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
    assertions: [{ kind: 'configOption', path: 'hooks.afterError' }],
    category: 'hooks',
    expected:
      'hooks.afterError array added at the top-level buildConfig object; the hook function receives an error argument and calls console.error (or similar logging); the hook returns result',
    fixturePath: 'hooks/codegen/add-root-afterError-hook',
    input: 'Add a root-level afterError hook to the config that logs every error to the console.',
  },
  {
    assertions: [{ slug: 'users', hook: 'beforeLogin', kind: 'collectionHook' }],
    category: 'hooks',
    expected:
      'beforeLogin hook added to the users collection hooks object; the hook checks user.isBanned and throws an APIError with HTTP status 403 if true; otherwise returns user',
    fixturePath: 'hooks/codegen/add-beforeLogin-hook',
    input:
      'Add a beforeLogin hook to the users collection that throws a 403 APIError if the user has a isBanned field set to true.',
  },
  {
    assertions: [{ slug: 'posts', hook: 'beforeOperation', kind: 'collectionHook' }],
    category: 'hooks',
    expected:
      'beforeOperation hook added to the posts collection hooks object; the hook receives args and operation, logs the operation name, and returns args',
    fixturePath: 'hooks/codegen/add-beforeOperation-hook',
    input:
      'Add a beforeOperation hook to the posts collection that logs the operation name before each operation begins.',
  },
  {
    assertions: [{ slug: 'posts', hook: 'afterDelete', kind: 'collectionHook' }],
    category: 'hooks',
    expected:
      'afterDelete hook added to the posts collection hooks object; the hook receives id (and optionally doc) and logs the id',
    fixturePath: 'hooks/codegen/add-afterDelete-hook',
    input:
      'Add an afterDelete hook to the posts collection that logs the deleted document id to the console.',
  },
  {
    category: 'hooks',
    expected:
      'afterChange hook body guards against re-entry by checking context.skipHooks (or similar flag) and passing context: { skipHooks: true } to the nested payload.update call',
    fixturePath: 'hooks/codegen/add-context-skipHooks-flag',
    input:
      'Update the afterChange hook on the posts collection to use req.context.skipHooks to prevent an infinite loop when the hook calls payload.update on the same document.',
    // AST cannot verify the inside of a hook body — rely on scorer
    assertions: [],
  },
  {
    category: 'hooks',
    expected:
      'beforeChange hook added to the header global hooks object; the hook sets data.updatedAt to new Date() (or Date.now()) and returns data',
    fixturePath: 'hooks/codegen/add-global-beforeChange',
    input:
      'Add a beforeChange hook to the header global that stamps an updatedAt field with the current date.',
    // parseConfig.ts does not scan globals — scorer-only
    assertions: [],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    category: 'hooks',
    expected:
      'collection-level afterRead hook that computes wordCount is removed (or reduced); a field-level afterRead hook is added on the wordCount field that computes its own value from doc.content (or similar)',
    fixturePath: 'hooks/codegen/field-level-vs-collection-level-fix',
    input:
      'This config computes a virtual wordCount field in a collection-level afterRead hook. Move the computation to a field-level afterRead hook on the wordCount field instead.',
    // The key assertion: the afterRead must end up on the FIELD, not the collection
    assertions: [{ slug: 'posts', field: 'wordCount', hook: 'afterRead', kind: 'fieldHook' }],
  },
]

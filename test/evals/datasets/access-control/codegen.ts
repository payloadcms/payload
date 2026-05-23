import type { CodegenEvalCase } from '../../types.js'

/**
 * Access control eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 *
 * AST catalog gaps as of Task 9:
 * - Global access functions are not parsed by parseConfig.ts (only collections
 *   are scanned) → scorer-only for global-level access cases
 * - `fieldOption { option: 'access' }` checks that the field has an access
 *   object but cannot inspect individual operation bodies → scorer supplements
 */
export const accessControlCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Add an update access function on the posts collection that only allows users with an admin role to update documents.',
    expected:
      'access.update function added to the posts collection; the function returns true only when req.user has an admin role (e.g. roles.includes("admin")); non-admins or unauthenticated users are denied',
    category: 'access-control',
    fixturePath: 'access-control/codegen/add-update-access',
    assertions: [{ kind: 'collectionAccess', slug: 'posts', operation: 'update' }],
  },
  {
    input:
      'Restrict reading version history on the posts collection to admins only. Non-admins should not be able to browse the version history.',
    expected:
      'access.readVersions function added to the posts collection; the function returns true only when req.user has an admin role; non-admins or unauthenticated users are denied',
    category: 'access-control',
    fixturePath: 'access-control/codegen/add-readVersions-access',
    assertions: [{ kind: 'collectionAccess', slug: 'posts', operation: 'readVersions' }],
  },
  {
    input:
      'Restrict the unlock access on the users collection so that only admins can unlock locked accounts.',
    expected:
      'access.unlock function added to the users collection; the function returns true only when req.user has an admin role; non-admins are denied',
    category: 'access-control',
    fixturePath: 'access-control/codegen/add-unlock-access',
    assertions: [{ kind: 'collectionAccess', slug: 'users', operation: 'unlock' }],
  },
  {
    input:
      'Add field-level read access to the ssn field on the customers collection so that only admins can read it. Non-admin users should not see the ssn field in API responses.',
    expected:
      'access.read function added to the ssn field on the customers collection; the function returns true only for admins; the field is omitted from responses for non-admins',
    category: 'access-control',
    fixturePath: 'access-control/codegen/field-level-read-access',
    assertions: [{ kind: 'fieldOption', slug: 'customers', field: 'ssn', option: 'access' }],
  },
  {
    input:
      'Add a delete access function on the posts collection that allows any authenticated user to soft-delete (trash) documents, but only admins can permanently delete them. Use data.deletedAt to discriminate between the two operations.',
    expected:
      'access.delete function added to the posts collection; the function checks data?.deletedAt — if set (soft delete / trash), any authenticated user is allowed; if not set (permanent delete), only admins are allowed',
    category: 'access-control',
    fixturePath: 'access-control/codegen/trash-discrimination-delete',
    assertions: [{ kind: 'collectionAccess', slug: 'posts', operation: 'delete' }],
  },
  {
    input:
      'Add an update access function on the posts collection that prevents non-admins from publishing — specifically, if the incoming data sets _status to "published", only admins should be allowed to proceed.',
    expected:
      'access.update function added to the posts collection; the function checks data?._status === "published" and denies non-admins when publishing; admins and draft saves by any authenticated user are allowed',
    category: 'access-control',
    fixturePath: 'access-control/codegen/draft-publish-constraint',
    assertions: [{ kind: 'collectionAccess', slug: 'posts', operation: 'update' }],
  },
  // ──────────────────────────────────────────────────────────
  // Correction cases — broken fixtures the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'The read access function on the posts collection calls id.startsWith("pub-") without guarding against undefined. This crashes when the admin panel loads because id is undefined during the Access Operation. Make the function safe.',
    expected:
      'The read access function guards against undefined id before calling startsWith — e.g. `if (!id) return Boolean(user)` or optional chaining — so it no longer crashes during the Access Operation',
    category: 'access-control',
    fixturePath: 'access-control/codegen/guard-undefined-id',
    // No AST assertion kind verifies the body of the access function — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Fix this access function — it crashes when no user is logged in. The read access on posts does req.user.role === "admin" which throws a TypeError when req.user is null.',
    expected:
      'The read access function on the posts collection no longer crashes when req.user is null — e.g. uses optional chaining (req.user?.role) or an explicit null check before accessing .role; unauthenticated requests return false or a Where constraint',
    category: 'access-control',
    fixturePath: 'access-control/codegen/fix-null-user-crash',
    // No AST assertion kind verifies the body of the access function — scorer carries the load.
    assertions: [],
  },
]

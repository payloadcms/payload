import type { CodegenEvalCase } from '../../types.js'

export const accessControlCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    assertions: [{ slug: 'posts', kind: 'collectionAccess', operation: 'update' }],
    category: 'access-control',
    expected:
      'access.update function added to the posts collection; the function returns true only when req.user has an admin role (e.g. roles.includes("admin")); non-admins or unauthenticated users are denied',
    fixturePath: 'access-control/codegen/add-update-access',
    input:
      'Add an update access function on the posts collection that only allows users with an admin role to update documents.',
  },
  {
    assertions: [{ slug: 'posts', kind: 'collectionAccess', operation: 'readVersions' }],
    category: 'access-control',
    expected:
      'access.readVersions function added to the posts collection; the function returns true only when req.user has an admin role; non-admins or unauthenticated users are denied',
    fixturePath: 'access-control/codegen/add-readVersions-access',
    input:
      'Restrict reading version history on the posts collection to admins only. Non-admins should not be able to browse the version history.',
  },
  {
    assertions: [{ slug: 'users', kind: 'collectionAccess', operation: 'unlock' }],
    category: 'access-control',
    expected:
      'access.unlock function added to the users collection; the function returns true only when req.user has an admin role; non-admins are denied',
    fixturePath: 'access-control/codegen/add-unlock-access',
    input:
      'Restrict the unlock access on the users collection so that only admins can unlock locked accounts.',
  },
  {
    assertions: [{ slug: 'customers', field: 'ssn', kind: 'fieldOption', option: 'access' }],
    category: 'access-control',
    expected:
      'access.read function added to the ssn field on the customers collection; the function returns true only for admins; the field is omitted from responses for non-admins',
    fixturePath: 'access-control/codegen/field-level-read-access',
    input:
      'Add field-level read access to the ssn field on the customers collection so that only admins can read it. Non-admin users should not see the ssn field in API responses.',
  },
  {
    assertions: [{ slug: 'posts', kind: 'collectionAccess', operation: 'update' }],
    category: 'access-control',
    expected:
      'access.update function added to the posts collection; the function checks data?._status === "published" and denies non-admins when publishing; admins and draft saves by any authenticated user are allowed',
    fixturePath: 'access-control/codegen/draft-publish-constraint',
    input:
      'Add an update access function on the posts collection that prevents non-admins from publishing — specifically, if the incoming data sets _status to "published", only admins should be allowed to proceed.',
  },
  // ──────────────────────────────────────────────────────────
  // Correction cases — broken fixtures the LLM must fix
  // ──────────────────────────────────────────────────────────
  // docs-grounded: correction-case for a common runtime crash; not exercised in test/access-control/. Pattern documented at docs/access-control/overview.mdx (Access Operation Context).
  {
    category: 'access-control',
    expected:
      'The read access function guards against undefined id before calling startsWith — e.g. `if (!id) return Boolean(user)` or optional chaining — so it no longer crashes during the Access Operation',
    fixturePath: 'access-control/codegen/guard-undefined-id',
    input:
      'The read access function on the posts collection calls id.startsWith("pub-") without guarding against undefined. This crashes when the admin panel loads because id is undefined during the Access Operation. Make the function safe.',
    // No AST assertion kind verifies the body of the access function — scorer carries the load.
    assertions: [],
  },
  {
    category: 'access-control',
    expected:
      'The read access function on the posts collection no longer crashes when req.user is null — e.g. uses optional chaining (req.user?.role) or an explicit null check before accessing .role; unauthenticated requests return false or a Where constraint',
    fixturePath: 'access-control/codegen/fix-null-user-crash',
    input:
      'Fix this access function — it crashes when no user is logged in. The read access on posts does req.user.role === "admin" which throws a TypeError when req.user is null.',
    // No AST assertion kind verifies the body of the access function — scorer carries the load.
    assertions: [],
  },
]

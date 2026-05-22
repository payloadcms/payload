import type { CodegenEvalCase } from '../../types.js'

/**
 * Custom Components eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 *
 * The assertion catalog covers collections, fields, hooks, and access — not
 * admin-level config properties like `admin.components.*` or field-level
 * `admin.components.*`. All custom-components config cases rely on the OpenAI
 * scorer rather than AST checks.
 */
export const customComponentsCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Register a custom beforeDashboard component at the path "/src/components/AnnouncementBanner" so it appears before the default dashboard content.',
    expected:
      'admin.components.beforeDashboard set to an array containing the path string "/src/components/AnnouncementBanner" (or equivalent path) in the buildConfig admin config',
    category: 'custom-components',
    fixturePath: 'custom-components/codegen/register-beforeDashboard',
    // No AST assertion kind covers admin.components.* config — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Replace the SaveButton in the posts collection edit view with a custom component at "/src/components/MySaveButton".',
    expected:
      'admin.components.edit.SaveButton set to "/src/components/MySaveButton" (or equivalent path string) on the posts collection config',
    category: 'custom-components',
    fixturePath: 'custom-components/codegen/register-custom-saveButton',
    // No AST assertion kind covers collection admin.components.edit.* — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Add a custom list view component to the posts collection using the component at "/src/views/PostsListView".',
    expected:
      'admin.components.views.list.Component set to "/src/views/PostsListView" (or equivalent path string) on the posts collection config',
    category: 'custom-components',
    fixturePath: 'custom-components/codegen/register-custom-list-view',
    // No AST assertion kind covers collection admin.components.views.* — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Add a custom admin Logo component at "/src/components/BrandLogo" so the login page shows a branded logo.',
    expected:
      'admin.components.graphics.Logo set to "/src/components/BrandLogo" (or equivalent path string) in the buildConfig admin config',
    category: 'custom-components',
    fixturePath: 'custom-components/codegen/register-graphics-logo',
    // No AST assertion kind covers admin.components.graphics.* config — scorer carries the load.
    assertions: [],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'This config registers a custom component but is missing admin.importMap.baseDir, which means component paths resolve from the wrong directory. Fix it so baseDir points to the src directory using path.resolve and import.meta.url.',
    expected:
      'admin.importMap.baseDir added and set to path.resolve(dirname, "src") (or equivalent using fileURLToPath + path.dirname) so that component path strings resolve correctly relative to the src directory',
    category: 'custom-components',
    fixturePath: 'custom-components/codegen/fix-missing-importmap-base',
    // No AST assertion kind covers admin.importMap.baseDir — scorer carries the load.
    assertions: [],
  },
]

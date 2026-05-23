import type { CodegenEvalCase } from '../../types.js'

/**
 * Custom Components eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 */
export const customComponentsCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    assertions: [{ kind: 'configOption', path: 'admin.components.beforeDashboard' }],
    category: 'custom-components',
    expected:
      'admin.components.beforeDashboard set to an array containing the path string "/src/components/AnnouncementBanner" (or equivalent path) in the buildConfig admin config',
    fixturePath: 'custom-components/codegen/register-beforeDashboard',
    input:
      'Register a custom beforeDashboard component at the path "/src/components/AnnouncementBanner" so it appears before the default dashboard content.',
  },
  {
    assertions: [
      { slug: 'posts', kind: 'collectionOption', path: 'admin.components.edit.SaveButton' },
    ],
    category: 'custom-components',
    expected:
      'admin.components.edit.SaveButton set to "/src/components/MySaveButton" (or equivalent path string) on the posts collection config',
    fixturePath: 'custom-components/codegen/register-custom-saveButton',
    input:
      'Replace the SaveButton in the posts collection edit view with a custom component at "/src/components/MySaveButton".',
  },
  // docs-grounded: no test/ config assigns admin.components.views.list.Component; pattern documented at docs/custom-components/list-view.mdx.
  {
    assertions: [{ slug: 'posts', kind: 'collectionOption', path: 'admin.components.views.list' }],
    category: 'custom-components',
    expected:
      'admin.components.views.list.Component set to "/src/views/PostsListView" (or equivalent path string) on the posts collection config',
    fixturePath: 'custom-components/codegen/register-custom-list-view',
    input:
      'Add a custom list view component to the posts collection using the component at "/src/views/PostsListView".',
  },
  {
    assertions: [{ kind: 'configOption', path: 'admin.components.graphics.Logo' }],
    category: 'custom-components',
    expected:
      'admin.components.graphics.Logo set to "/src/components/BrandLogo" (or equivalent path string) in the buildConfig admin config',
    fixturePath: 'custom-components/codegen/register-graphics-logo',
    input:
      'Add a custom admin Logo component at "/src/components/BrandLogo" so the login page shows a branded logo.',
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    assertions: [{ kind: 'configOption', path: 'admin.importMap.baseDir' }],
    category: 'custom-components',
    expected:
      'admin.importMap.baseDir added and set to path.resolve(dirname, "src") (or equivalent using fileURLToPath + path.dirname) so that component path strings resolve correctly relative to the src directory',
    fixturePath: 'custom-components/codegen/fix-missing-importmap-base',
    input:
      'This config registers a custom component but is missing admin.importMap.baseDir, which means component paths resolve from the wrong directory. Fix it so baseDir points to the src directory using path.resolve and import.meta.url.',
  },
]

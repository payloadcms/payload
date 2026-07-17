/**
 * E2E Test Matrix Configuration
 *
 * This file defines which test files to run and how many shards to split them into.
 * The CI workflow reads this config to generate the test matrix.
 *
 * Usage: node .github/workflows/e2e.config.ts
 */

import type { TestConfig } from './utilities/e2e-matrix.ts'

import { createE2EConfig } from './utilities/e2e-matrix.ts'

const nextSuites: TestConfig[] = [
  { file: '_community', shards: 1 },
  { file: 'a11y', shards: 1 },
  { file: 'access-control', shards: 2 },
  { file: 'admin__e2e__general', shards: 3 },
  { file: 'admin__e2e__list-view', shards: 4 },
  { file: 'admin__e2e__document-view', shards: 3 },
  { file: 'admin-bar', shards: 1 },
  { file: 'admin-root', shards: 1 },
  { file: 'auth', shards: 1 },
  { file: 'auth-basic', shards: 1 },
  { file: 'bulk-edit', shards: 2 },
  { file: 'dashboard', shards: 1 },
  { file: 'joins', shards: 1 },
  { file: 'field-error-states', shards: 1 },
  { file: 'field-paths', shards: 1 },
  { file: 'fields-relationship', shards: 1 },
  { file: 'fields__collections__Array', shards: 1 },
  { file: 'fields__collections__Blocks', shards: 2 },
  { file: 'fields__collections__Blocks#config.blockreferences.ts', shards: 2 },
  { file: 'fields__collections__Checkbox', shards: 1 },
  { file: 'fields__collections__Collapsible', shards: 1 },
  { file: 'fields__collections__ConditionalLogic', shards: 1 },
  { file: 'fields__collections__CustomID', shards: 1 },
  { file: 'fields__collections__Date', shards: 2 },
  { file: 'fields__collections__Email', shards: 1 },
  { file: 'fields__collections__Indexed', shards: 1 },
  { file: 'fields__collections__JSON', shards: 1 },
  { file: 'fields__collections__Number', shards: 1 },
  { file: 'fields__collections__Point', shards: 1 },
  { file: 'fields__collections__Radio', shards: 1 },
  { file: 'fields__collections__Relationship', shards: 2 },
  { file: 'fields__collections__Row', shards: 1 },
  { file: 'fields__collections__Select', shards: 1 },
  { file: 'fields__collections__Tabs', shards: 1 },
  { file: 'fields__collections__Tabs2', shards: 1 },
  { file: 'fields__collections__Text', shards: 1 },
  { file: 'fields__collections__UI', shards: 1 },
  { file: 'fields__collections__Upload', shards: 1 },
  { file: 'fields__collections__UploadPoly', shards: 1 },
  { file: 'fields__collections__UploadMultiPoly', shards: 1 },
  { file: 'group-by', shards: 1 },
  { file: 'hierarchy', shards: 1 },
  { file: 'hooks', shards: 1 },
  // TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
  // it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
  { file: 'lexical__collections___LexicalFullyFeatured', shards: 1, parallel: false },
  { file: 'lexical__collections___LexicalFullyFeatured__db', shards: 1 },
  // TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
  // it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
  { file: 'lexical__collections__LexicalHeadingFeature', shards: 1, parallel: false },
  // TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
  // it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
  { file: 'lexical__collections__LexicalJSXConverter', shards: 1, parallel: false },
  // TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
  // it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
  { file: 'lexical__collections__LexicalLinkFeature', shards: 1, parallel: false },
  // TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
  // it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
  { file: 'lexical__collections__LexicalListsFeature', shards: 1, parallel: false },
  { file: 'lexical__collections__LexicalViewsFrontend', shards: 1, parallel: false },
  { file: 'lexical__collections__LexicalViewsProvider', shards: 1, parallel: false },
  { file: 'lexical__collections__LexicalViewsProviderDefault', shards: 1, parallel: false },
  { file: 'lexical__collections__LexicalViewsNested', shards: 1, parallel: false },
  { file: 'lexical__collections__LexicalAutosaveBlock', shards: 1, parallel: false },

  { file: 'lexical__collections__OnDemandForm', shards: 1 },
  { file: 'lexical__collections__Lexical__e2e__main', shards: 2 },
  { file: 'lexical__collections__Lexical__e2e__blocks', shards: 2 },
  { file: 'lexical__collections__Lexical__e2e__blocks#config.blockreferences.ts', shards: 2 },
  { file: 'query-presets', shards: 1 },
  { file: 'form-state', shards: 1 },
  { file: 'live-preview', shards: 2 },
  { file: 'localization', shards: 2 },
  { file: 'locked-documents', shards: 1 },
  { file: 'i18n', shards: 1 },
  { file: 'plugin-cloud-storage', shards: 1 },
  { file: 'storage-azure__client-uploads#client-uploads/config.ts', shards: 1 },
  { file: 'storage-s3__client-uploads#client-uploads/config.ts', shards: 1 },
  { file: 'storage-vercel-blob__client-uploads#client-uploads/config.ts', shards: 1 },
  { file: 'plugin-form-builder', shards: 1 },
  { file: 'plugin-import-export', shards: 1 },
  { file: 'plugin-multi-tenant', shards: 2 },
  { file: 'plugin-multi-tenant#config.conditionalProvider.ts', shards: 1 },
  { file: 'plugin-nested-docs', shards: 1 },
  { file: 'plugin-redirects', shards: 1 },
  { file: 'plugin-seo', shards: 1 },
  { file: 'queues', shards: 1 },
  { file: 'sort', shards: 1 },
  { file: 'server-url', shards: 1 },
  { file: 'trash', shards: 2 },
  { file: 'versions', shards: 3 },
  { file: 'uploads', shards: 3 },
]

/**
 * Suites verified passing under the tanstack-start adapter. These are required, so their
 * failures block the `all-green` gate. Promote a suite here once it passes reliably.
 */
const requiredTanstackFiles = new Set([
  '_community',
  'admin-bar',
  'server-url',
  'field-paths',
  'auth-basic',
  'plugin-redirects',
  'sort',
  'hooks',
  'plugin-nested-docs',
  'i18n',
  'a11y',
  'plugin-mcp',
])

/**
 * Suites known to fail under the tanstack-start adapter. Excluded from the matrix entirely
 * so they don't burn CI cycles. Remove a file here once the adapter is fixed to re-enable it.
 */
const blacklistedTanstackFiles = new Set([
  'base-path',
  'server-functions',
  'plugin-cloud-storage',
  'plugin-seo',
])

/**
 * Full tanstack-start matrix, for a high-level view of adapter coverage across all suites.
 * Verified-passing suites (`requiredTanstackFiles`) block the `all-green` gate; every other
 * suite runs optional (non-blocking) until it stabilizes. Blacklisted suites are skipped.
 * `plugin-mcp` is not part of `nextSuites` but passes under tanstack-start, so it is added explicitly.
 */
const tanstackSuites: TestConfig[] = [
  ...nextSuites
    .filter((suite) => !blacklistedTanstackFiles.has(suite.file))
    .map((suite) => ({
      ...suite,
      framework: 'tanstack-start' as const,
      optional: !requiredTanstackFiles.has(suite.file),
    })),
  { file: 'plugin-mcp', framework: 'tanstack-start', optional: false, shards: 1 },
]

export default createE2EConfig([...nextSuites, ...tanstackSuites])

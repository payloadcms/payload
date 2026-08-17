import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

const internalPackages = [
  'packages/db-mongodb',
  'packages/payload',
  'packages/plugin-mcp',
  'packages/richtext-lexical',
  'packages/ui',
] as const

const uiClientInternalExports = [
  'AccountClient',
  'AccountLanguageSelector',
  'AccountResetPreferences',
  'AccountToggleHighContrast',
  'AccountToggleTheme',
  'APIViewClient',
  'AppHeader',
  'BulkUploadModal',
  'CollectionQuerySortField',
  'Combobox',
  'ComboboxEntry',
  'ComboboxProps',
  'CommandPalette',
  'CopyLocaleData',
  'CreateFirstUserClient',
  'DateCell',
  'DefaultCell',
  'DefaultEditView',
  'DefaultNavClient',
  'DefaultTemplateWrapper',
  'DefaultVersionView',
  'DeleteMany',
  'DocumentControls',
  'DocumentFields',
  'DocumentHeaderRoot',
  'DocumentLocked',
  'DocumentStaleData',
  'DocumentTabLink',
  'DocumentTakeOver',
  'EditMany',
  'ForgotPasswordForm',
  'GenerateConfirmation',
  'GroupByHeader',
  'GroupByPageControls',
  'HierarchyButtonClient',
  'HierarchyFieldClient',
  'HierarchyListView',
  'HierarchySidebarTab',
  'HydrateAuthProvider',
  'HydrateHierarchyProvider',
  'LeaveWithoutSaving',
  'ListControls',
  'ListControlsBar',
  'ListHeader',
  'ListSelection',
  'LoginForm',
  'LogoutClient',
  'ModularDashboardClient',
  'NavSidebarToggle',
  'NavWrapper',
  'NotFoundClient',
  'OrderableTable',
  'PageControls',
  'PageControlsComponent',
  'PublishMany',
  'QueryPresetsAccessCell',
  'QueryPresetsColumnField',
  'QueryPresetsColumnsCell',
  'QueryPresetsGroupByCell',
  'QueryPresetsGroupByField',
  'QueryPresetsHeading',
  'QueryPresetsWhereCell',
  'QueryPresetsWhereField',
  'RecentlyViewedCollectionsField',
  'RenderDefaultCell',
  'RenderVersionFieldsToDiff',
  'ResetPasswordForm',
  'SetDocumentStepNav',
  'SetDocumentTitle',
  'SettingsMenuButton',
  'ShouldRenderTabs',
  'SidebarTabsClient',
  'SortColumn',
  'SortHeader',
  'SortRow',
  'TabError',
  'TableColumnsProvider',
  'ToastAndRedirect',
  'UnpublishMany',
  'VerifyClient',
  'VersionDrawerCreatedAtCell',
  'VersionFieldDiffCheckbox',
  'VersionFieldDiffCollapsible',
  'VersionFieldDiffDate',
  'VersionFieldDiffGroup',
  'VersionFieldDiffIterable',
  'VersionFieldDiffRow',
  'VersionFieldDiffSelect',
  'VersionFieldDiffTabs',
  'VersionFieldDiffText',
  'VersionPillLabel',
  'VersionsAutosaveCell',
  'VersionsCreatedAtCell',
  'VersionsIDCell',
  'VersionsPill',
  'VersionsViewClient',
] as const

const uiRSCInternalExports = [
  'HierarchyButton',
  'HierarchyField',
  'HierarchySidebarTabServer',
] as const

const uiInternalSubpaths = [
  './internal',
  './internal/rsc',
  './internal/server',
  './internal/shared',
] as const

const uiBlockedPublicSubpaths = [
  './elements/AppHeader',
  './elements/CommandPalette',
  './elements/Combobox',
  './elements/CopyLocaleData',
  './elements/DeleteMany',
  './elements/DocumentControls',
  './elements/DocumentFields',
  './elements/DocumentHeader/DocumentHeaderRoot',
  './elements/DocumentHeader/Tabs/*',
  './elements/DocumentLocked',
  './elements/DocumentStaleData',
  './elements/DocumentTakeOver',
  './elements/EditMany',
  './elements/GenerateConfirmation',
  './elements/Hierarchy/DocHeaderButton',
  './elements/Hierarchy/HydrateProvider',
  './elements/ListControls',
  './elements/ListControlsBar',
  './elements/Nav/*',
  './elements/PageControls',
  './elements/PublishMany',
  './elements/QueryPresets/*',
  './elements/SortHeader',
  './elements/SortRow',
  './elements/Table/DefaultCell',
  './elements/Table/DefaultCell/fields/Date',
  './elements/UnpublishMany',
  './views/Account/ResetPreferences',
  './views/Account/Settings/LanguageSelector',
  './views/Account/ToggleHighContrast',
  './views/Account/ToggleTheme',
  './views/Dashboard/Default/ModularDashboard',
  './views/Edit',
  './views/Edit/SetDocumentStepNav',
  './views/Edit/SetDocumentTitle',
  './views/ForgotPassword/ForgotPasswordForm',
  './views/HierarchyList',
  './views/List/GroupByHeader',
  './views/List/ListHeader',
  './views/List/ListSelection',
  './views/Login/LoginForm',
  './views/ResetPassword/ResetPasswordForm',
  './views/Version/Default',
  './views/Version/RenderFieldsToDiff/*',
  './views/Versions/cells/*',
] as const

const readPackageJSON = (packageDirectory: (typeof internalPackages)[number]) => {
  return JSON.parse(
    readFileSync(path.join(repositoryRoot, packageDirectory, 'package.json'), 'utf8'),
  ) as {
    exports: Record<string, null | { import: string }>
    publishConfig: { exports: Record<string, null | { import: string }> }
  }
}

const getExportNames = (sourcePath: string): Set<string> => {
  const source = readFileSync(sourcePath, 'utf8')
  const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true)
  const names = new Set<string>()

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause) {
      continue
    }

    if (ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        names.add(element.name.text)
      }
    }
  }

  return names
}

const expectInternalJSDoc = (sourcePath: string): void => {
  const source = readFileSync(sourcePath, 'utf8')
  const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true)
  const exportDeclarations = sourceFile.statements.filter(ts.isExportDeclaration)

  expect(source).toMatch(/\/\*\*[\s\S]*?@internal[\s\S]*?\*\//)
  expect(exportDeclarations.length).toBeGreaterThan(0)

  for (const exportDeclaration of exportDeclarations) {
    expect(exportDeclaration.getFullText(sourceFile)).toMatch(/@internal/)
  }
}

describe('internal package exports', () => {
  it.each(internalPackages)(
    'should expose a canonical internal subpath for %s',
    (packageDirectory) => {
      const packageJSON = readPackageJSON(packageDirectory)

      expect(packageJSON.exports['./internal']).toBeDefined()
      expect(packageJSON.publishConfig.exports['./internal']).toBeDefined()
    },
  )

  it('should not expose the deprecated Lexical internal-client subpath', () => {
    const packageJSON = readPackageJSON('packages/richtext-lexical')

    expect(packageJSON.exports['./internal-client']).toBeUndefined()
    expect(packageJSON.publishConfig.exports['./internal-client']).toBeUndefined()
  })

  it.each(internalPackages)(
    'should mark every internal export in %s with JSDoc',
    (packageDirectory) => {
      const packageJSON = readPackageJSON(packageDirectory)
      const sourceExport = packageJSON.exports['./internal']

      expect(sourceExport).not.toBeNull()
      expect(sourceExport).toBeDefined()

      if (!sourceExport) {
        return
      }

      expectInternalJSDoc(path.join(repositoryRoot, packageDirectory, sourceExport.import))
    },
  )

  it('should expose internal UI modules through environment-specific subpaths', () => {
    const packageJSON = readPackageJSON('packages/ui')

    for (const subpath of uiInternalSubpaths) {
      expect(packageJSON.exports[subpath]).toBeDefined()
      expect(packageJSON.publishConfig.exports[subpath]).toBeDefined()

      const sourceExport = packageJSON.exports[subpath]

      expect(sourceExport).not.toBeNull()

      if (sourceExport) {
        expectInternalJSDoc(path.join(repositoryRoot, 'packages/ui', sourceExport.import))
      }
    }
  })

  it('should block internal implementation files from broad public subpath patterns', () => {
    const packageJSON = readPackageJSON('packages/ui')

    for (const subpath of uiBlockedPublicSubpaths) {
      expect(packageJSON.exports[subpath]).toBeNull()
      expect(packageJSON.publishConfig.exports[subpath]).toBeNull()
    }
  })

  it('should expose the approved client implementation surface only through UI internal', () => {
    const packageJSON = readPackageJSON('packages/ui')
    const internalExport = packageJSON.exports['./internal']

    expect(internalExport).not.toBeNull()

    if (!internalExport) {
      return
    }

    const internalNames = getExportNames(
      path.join(repositoryRoot, 'packages/ui', internalExport.import),
    )
    const publicNames = getExportNames(
      path.join(repositoryRoot, 'packages/ui/src/exports/client/index.ts'),
    )

    expect([...uiClientInternalExports].filter((name) => !internalNames.has(name))).toEqual([])
    expect([...uiClientInternalExports].filter((name) => publicNames.has(name))).toEqual([])

    for (const publicName of [
      'BulkUploadProvider',
      'CodeEditorLazy',
      'ErrorPill',
      'NullField',
      'SectionTitle',
      'useControllableState',
    ]) {
      expect(publicNames).toContain(publicName)
      expect(internalNames).not.toContain(publicName)
    }
  })

  it('should expose approved server components only through UI internal RSC', () => {
    const packageJSON = readPackageJSON('packages/ui')
    const internalExport = packageJSON.exports['./internal/rsc']

    expect(internalExport).not.toBeNull()

    if (!internalExport) {
      return
    }

    const internalNames = getExportNames(
      path.join(repositoryRoot, 'packages/ui', internalExport.import),
    )
    const publicNames = getExportNames(
      path.join(repositoryRoot, 'packages/ui/src/exports/rsc/index.ts'),
    )

    expect([...uiRSCInternalExports].filter((name) => !internalNames.has(name))).toEqual([])
    expect([...uiRSCInternalExports].filter((name) => publicNames.has(name))).toEqual([])
    expect(publicNames).toContain('CollectionQueryWidget')
    expect(publicNames).toContain('RecentlyViewedWidget')
  })

  it('should keep internal shared and server utilities out of their public barrels', () => {
    const packageJSON = readPackageJSON('packages/ui')
    const sharedExport = packageJSON.exports['./internal/shared']
    const serverExport = packageJSON.exports['./internal/server']

    expect(sharedExport).not.toBeNull()
    expect(serverExport).not.toBeNull()

    if (!sharedExport || !serverExport) {
      return
    }

    expect(getExportNames(path.join(repositoryRoot, 'packages/ui', sharedExport.import))).toContain(
      'getNavGroups',
    )
    expect(getExportNames(path.join(repositoryRoot, 'packages/ui', serverExport.import))).toContain(
      'getCollectionCardsData',
    )
    expect(
      getExportNames(path.join(repositoryRoot, 'packages/ui/src/exports/shared/index.ts')),
    ).not.toContain('getNavGroups')
    expect(
      getExportNames(path.join(repositoryRoot, 'packages/ui/src/exports/server.ts')),
    ).not.toContain('getCollectionCardsData')
  })

  it('should use internal UI paths for core-generated component references', () => {
    const payloadSource = [
      'packages/payload/src/config/sanitize.ts',
      'packages/payload/src/hierarchy/createTagField.ts',
      'packages/payload/src/hierarchy/injectHierarchyButton.ts',
      'packages/payload/src/hierarchy/resolveHierarchyCollections.ts',
      'packages/payload/src/query-presets/config.ts',
      'packages/payload/src/query-presets/constraints.ts',
      'templates/blank/src/app/(payload)/admin/importMap.js',
      'templates/website/src/app/(payload)/admin/importMap.js',
    ]
      .map((sourcePath) => readFileSync(path.join(repositoryRoot, sourcePath), 'utf8'))
      .join('\n')

    expect(payloadSource).not.toMatch(/@payloadcms\/ui#QueryPresets/)
    expect(payloadSource).not.toMatch(
      /@payloadcms\/ui\/rsc#Hierarchy(?:Button|Field|SidebarTabServer)/,
    )
    expect(payloadSource).toMatch(/@payloadcms\/ui\/internal#QueryPresets/)
    expect(payloadSource).toMatch(
      /@payloadcms\/ui\/internal\/rsc#Hierarchy(?:Button|Field|SidebarTabServer)/,
    )
  })
})

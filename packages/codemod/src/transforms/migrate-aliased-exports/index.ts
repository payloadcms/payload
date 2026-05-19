import type { ImportDeclaration, ImportSpecifier, SourceFile } from 'ts-morph'

import type { Transform } from '../../types.js'

type Migration = {
  rename?: string
  to: string
}

const SOURCE_MAP: Record<string, Record<string, Migration>> = {
  '@payloadcms/next/utilities': {
    addDataAndFileToRequest: { to: 'payload' },
    addLocalesToRequestFromData: { to: 'payload' },
    createPayloadRequest: { to: 'payload' },
    headersWithCors: { to: 'payload' },
    mergeHeaders: { to: 'payload' },
    sanitizeLocales: { to: 'payload' },
  },
  '@payloadcms/ui': {
    Column: { to: 'payload' },
    ListComponentClientProps: { rename: 'ListViewClientProps', to: 'payload' },
    ListComponentServerProps: { rename: 'ListViewServerProps', to: 'payload' },
    ListPreferences: { rename: 'CollectionPreferences', to: 'payload' },
    ListViewClientProps: { to: 'payload' },
    ListViewSlots: { to: 'payload' },
  },
  '@payloadcms/ui/shared': {
    EntityType: { to: 'payload/shared' },
    formatAdminURL: { to: 'payload/shared' },
    mergeListSearchAndWhere: { to: 'payload/shared' },
  },
}

type MigratingSpec = {
  migration: Migration
  named: ImportSpecifier
}

export const migrateAliasedExports: Transform = {
  name: 'migrate-aliased-exports',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const file of project.getSourceFiles()) {
      let mutated = false

      for (const importDecl of [...file.getImportDeclarations()]) {
        const migrations = SOURCE_MAP[importDecl.getModuleSpecifierValue()]
        if (!migrations) {
          continue
        }

        const named = importDecl.getNamedImports()
        const migrating: MigratingSpec[] = []
        let kept = 0

        for (const spec of named) {
          const migration = migrations[spec.getName()]
          if (migration) {
            migrating.push({ migration, named: spec })
          } else {
            kept++
          }
        }

        if (migrating.length === 0) {
          continue
        }

        const targets = new Set(migrating.map(({ migration }) => migration.to))

        if (kept === 0 && targets.size === 1) {
          const [target] = [...targets]
          importDecl.setModuleSpecifier(target!)
          for (const { migration, named: spec } of migrating) {
            applyRename({ migration, notes, sourceFile: file, spec, target: target! })
          }
          mutated = true
          continue
        }

        for (const { migration, named: spec } of migrating) {
          const isTypeOnly = importDecl.isTypeOnly() || spec.isTypeOnly()
          const aliasNode = spec.getAliasNode()
          const localName = aliasNode?.getText() ?? spec.getName()
          const canonicalName = migration.rename ?? spec.getName()
          const alias = localName !== canonicalName ? localName : undefined

          spec.remove()

          attachToTargetImport({
            file,
            isTypeOnly,
            named: { name: canonicalName, alias },
            target: migration.to,
          })

          if (migration.rename) {
            notes.push(
              renameNote({ filePath: file.getFilePath(), migration, originalName: spec.getName() }),
            )
          }
        }

        const remaining = importDecl.getNamedImports()
        if (
          remaining.length === 0 &&
          !importDecl.getDefaultImport() &&
          !importDecl.getNamespaceImport()
        ) {
          importDecl.remove()
        }

        mutated = true
      }

      if (mutated) {
        filesChanged.add(file.getFilePath())
      }
    }

    return {
      filesChanged: [...filesChanged],
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Move imports of aliased re-exports from @payloadcms/ui and @payloadcms/next/utilities to their canonical sources in `payload` / `payload/shared`. Renamed names (`ListPreferences` → `CollectionPreferences`, `ListComponentClientProps` → `ListViewClientProps`, `ListComponentServerProps` → `ListViewServerProps`) are imported using an `as` alias so existing usages keep compiling.',
}

type ApplyRenameArgs = {
  migration: Migration
  notes: string[]
  sourceFile: SourceFile
  spec: ImportSpecifier
  target: string
}

function applyRename({ migration, notes, sourceFile, spec, target }: ApplyRenameArgs): void {
  if (!migration.rename) {
    return
  }

  const originalName = spec.getName()
  const aliasNode = spec.getAliasNode()
  const localName = aliasNode?.getText() ?? originalName

  spec.setName(migration.rename)

  if (localName !== migration.rename) {
    spec.setAlias(localName)
  } else {
    spec.removeAlias()
  }

  notes.push(renameNote({ filePath: sourceFile.getFilePath(), migration, originalName }))
}

type RenameNoteArgs = {
  filePath: string
  migration: Migration
  originalName: string
}

function renameNote({ filePath, migration, originalName }: RenameNoteArgs): string {
  return `${filePath}: \`${originalName}\` is now \`${migration.rename}\` in \`${migration.to}\`. Codemod imported as \`${migration.rename} as ${originalName}\`; rename usages manually if you want to drop the alias.`
}

type AttachToTargetArgs = {
  file: SourceFile
  isTypeOnly: boolean
  named: { alias?: string; name: string }
  target: string
}

function attachToTargetImport({ file, isTypeOnly, named, target }: AttachToTargetArgs): void {
  const localName = named.alias ?? named.name
  const existing = findExistingTarget({ file, isTypeOnly, target })

  if (existing) {
    const declTypeOnly = existing.isTypeOnly()
    const alreadyHas = existing
      .getNamedImports()
      .some((spec) => (spec.getAliasNode()?.getText() ?? spec.getName()) === localName)
    if (alreadyHas) {
      return
    }
    existing.addNamedImport({
      name: named.name,
      alias: named.alias,
      isTypeOnly: !declTypeOnly && isTypeOnly,
    })
    return
  }

  file.addImportDeclaration({
    isTypeOnly,
    moduleSpecifier: target,
    namedImports: [{ name: named.name, alias: named.alias }],
  })
}

type FindExistingTargetArgs = {
  file: SourceFile
  isTypeOnly: boolean
  target: string
}

function findExistingTarget({
  file,
  isTypeOnly,
  target,
}: FindExistingTargetArgs): ImportDeclaration | undefined {
  const candidates = file
    .getImportDeclarations()
    .filter((decl) => decl.getModuleSpecifierValue() === target)

  if (candidates.length === 0) {
    return undefined
  }

  if (isTypeOnly) {
    return candidates.find((decl) => decl.isTypeOnly()) ?? candidates[0]
  }

  return candidates.find((decl) => !decl.isTypeOnly()) ?? candidates[0]
}

import type { Transform } from '../../types.js'

const SUBPATH_TO_MAIN: Record<string, string> = {
  '@payloadcms/db-d1-sqlite/types': '@payloadcms/db-d1-sqlite',
  '@payloadcms/db-postgres/types': '@payloadcms/db-postgres',
  '@payloadcms/db-sqlite/types': '@payloadcms/db-sqlite',
  '@payloadcms/db-vercel-postgres/types': '@payloadcms/db-vercel-postgres',
  '@payloadcms/drizzle/types': '@payloadcms/drizzle',
}

export const migrateDbTypesSubpath: Transform = {
  name: 'migrate-db-types-subpath',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const file of project.getSourceFiles()) {
      let mutated = false

      for (const importDecl of file.getImportDeclarations()) {
        const specifier = importDecl.getModuleSpecifierValue()
        const main = SUBPATH_TO_MAIN[specifier]
        if (main) {
          importDecl.setModuleSpecifier(main)
          mutated = true
        }
      }

      for (const exportDecl of file.getExportDeclarations()) {
        const specifier = exportDecl.getModuleSpecifierValue()
        if (specifier) {
          const main = SUBPATH_TO_MAIN[specifier]
          if (main) {
            exportDecl.setModuleSpecifier(main)
            mutated = true
          }
        }
      }

      // Handle `declare module '@payloadcms/.../types' { }` augmentations.
      // getName() on an ambient module declaration includes the surrounding quotes.
      for (const moduleDecl of file.getModules()) {
        const rawName = moduleDecl.getName()
        const specifier = rawName.replace(/^['"`]|['"`]$/g, '')
        const main = SUBPATH_TO_MAIN[specifier]
        if (main) {
          moduleDecl.getNameNode().replaceWithText(`'${main}'`)
          mutated = true
        }
      }

      if (mutated) {
        filesChanged.add(file.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Rewrites imports from the removed `/types` subpath exports of `@payloadcms/drizzle` and database adapter packages to their main entry point. Also handles re-export declarations and `declare module` augmentations for the same paths.',
}

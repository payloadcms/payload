import type { Transform } from '../../types.js'

const PACKAGE_NAME = '@payloadcms/richtext-lexical'
const OLD_NAME = 'EXPERIMENTAL_TableFeature'
const NEW_NAME = 'TableFeature'

export const renameExperimentalTableFeature: Transform = {
  name: 'rename-experimental-table-feature',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const file of project.getSourceFiles()) {
      for (const importDecl of file.getImportDeclarations()) {
        if (importDecl.getModuleSpecifierValue() !== PACKAGE_NAME) {
          continue
        }

        const named = importDecl.getNamedImports()
        const spec = named.find((specifier) => specifier.getName() === OLD_NAME)
        if (!spec) {
          continue
        }

        // Skip if `TableFeature` is already imported here too, to avoid a collision.
        const hasNewName = named.some(
          (specifier) => (specifier.getAliasNode()?.getText() ?? specifier.getName()) === NEW_NAME,
        )
        if (hasNewName) {
          continue
        }

        if (spec.getAliasNode()) {
          // Aliased usages (`EXPERIMENTAL_TableFeature as Foo`) only reference the alias,
          // so the imported name can be swapped without touching call sites.
          spec.setName(NEW_NAME)
        } else {
          // No alias: the imported name is also the local binding, so rename it to update
          // every call site (e.g. `EXPERIMENTAL_TableFeature()`) in the same pass.
          spec.getNameNode().rename(NEW_NAME)
        }

        filesChanged.add(file.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Renames imports of `EXPERIMENTAL_TableFeature` from `@payloadcms/richtext-lexical` to `TableFeature` (the table feature is now stable) and updates all local usages.',
}

import type { Transform } from '../../types.js'

const RENAMES: Record<string, string> = {
  EditViewComponent: 'DocumentViewComponent',
  EditViewConfig: 'DocumentViewConfig',
}

export const renameEditViewTypes: Transform = {
  name: 'rename-edit-view-types',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      for (const importDecl of sourceFile.getImportDeclarations()) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue()
        if (moduleSpecifier !== 'payload' && moduleSpecifier !== 'payload/shared') {
          continue
        }

        for (const spec of importDecl.getNamedImports()) {
          const name = spec.getName()
          const renamed = RENAMES[name]
          if (!renamed) {
            continue
          }

          const aliasNode = spec.getAliasNode()
          const localName = aliasNode?.getText() ?? name

          spec.setName(renamed)

          if (localName !== renamed) {
            spec.setAlias(localName)
          } else {
            spec.removeAlias()
          }

          mutated = true
        }
      }

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Rename deprecated `EditViewComponent` → `DocumentViewComponent` and `EditViewConfig` → `DocumentViewConfig` in import statements. Usages keep compiling via `as` alias when the local name differs.',
}

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Maps the removed `@payloadcms/next` subpaths to their new `@payloadcms/ui`
 * targets. All admin elements and templates were relocated to `@payloadcms/ui`
 * in v4; the `./client`, `./rsc`, and `./templates` subpaths on
 * `@payloadcms/next` have been removed.
 */
const SUBPATH_TO_TARGET: Record<string, string> = {
  '@payloadcms/next/client': '@payloadcms/ui',
  '@payloadcms/next/rsc': '@payloadcms/ui/rsc',
  '@payloadcms/next/templates': '@payloadcms/ui/rsc',
}

// `<package>` or `<package>#<exportName>` — the export identifier follows
// JavaScript identifier rules so we reject anything with whitespace or
// punctuation that would indicate it's actually prose containing the path.
const COMPONENT_PATH_PATTERN = /^@payloadcms\/next\/(client|rsc|templates)(#[A-Za-z_$][\w$]*)?$/

function mapComponentPath(value: string): string | undefined {
  const match = COMPONENT_PATH_PATTERN.exec(value)
  if (!match) {
    return undefined
  }
  const subpath = `@payloadcms/next/${match[1]}`
  const target = SUBPATH_TO_TARGET[subpath]
  if (!target) {
    return undefined
  }
  return match[2] ? `${target}${match[2]}` : target
}

export const migrateNextSubpathExports: Transform = {
  name: 'migrate-next-subpath-exports',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const file of project.getSourceFiles()) {
      let mutated = false

      for (const importDecl of file.getImportDeclarations()) {
        const target = SUBPATH_TO_TARGET[importDecl.getModuleSpecifierValue()]
        if (target) {
          importDecl.setModuleSpecifier(target)
          mutated = true
        }
      }

      for (const exportDecl of file.getExportDeclarations()) {
        const specifier = exportDecl.getModuleSpecifierValue()
        if (specifier) {
          const target = SUBPATH_TO_TARGET[specifier]
          if (target) {
            exportDecl.setModuleSpecifier(target)
            mutated = true
          }
        }
      }

      // Rewrite string-literal component paths used in Payload config
      // (e.g. `Component: '@payloadcms/next/rsc#CollectionCards'`) and
      // import-map keys.
      for (const stringLit of file.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
        if (isImportOrExportSpecifier(stringLit)) {
          continue
        }
        const value = stringLit.getLiteralValue()
        const replacement = mapComponentPath(value)
        if (replacement && replacement !== value) {
          stringLit.setLiteralValue(replacement)
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
    'Rewrites imports, re-exports, and string-literal component paths from the removed `@payloadcms/next/client`, `@payloadcms/next/rsc`, and `@payloadcms/next/templates` subpaths to their canonical `@payloadcms/ui` or `@payloadcms/ui/rsc` sources. After running, regenerate the import map with `payload generate:importmap`.',
}

/**
 * Skip string literals that form the module specifier of an import/export
 * declaration — those are already handled by the dedicated traversals above
 * and rewriting them through `setLiteralValue` would double-process.
 */
function isImportOrExportSpecifier(node: Node): boolean {
  const parent = node.getParent()
  if (!parent) {
    return false
  }
  if (Node.isImportDeclaration(parent) || Node.isExportDeclaration(parent)) {
    return parent.getModuleSpecifier() === node
  }
  return false
}

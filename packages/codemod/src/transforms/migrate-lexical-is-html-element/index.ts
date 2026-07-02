import type { ImportDeclaration, SourceFile } from 'ts-morph'

import type { Transform } from '../../types.js'

const SYMBOL = 'isHTMLElement'
const TARGET = 'lexical'

/** Sources that used to re-export `isHTMLElement` before it was removed in v4. */
const SOURCES = new Set(['@payloadcms/richtext-lexical', '@payloadcms/richtext-lexical/client'])

const INSTALL_WARNING = `\`${TARGET}\` is now a required dependency for \`${SYMBOL}\`. Install it with \`pnpm add ${TARGET}\` (or your package manager's equivalent).`

export const migrateLexicalIsHTMLElement: Transform = {
  name: 'migrate-lexical-is-html-element',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    let movedAny = false

    for (const file of project.getSourceFiles()) {
      let mutated = false

      for (const importDecl of [...file.getImportDeclarations()]) {
        if (!SOURCES.has(importDecl.getModuleSpecifierValue())) {
          continue
        }

        const spec = importDecl.getNamedImports().find((named) => named.getName() === SYMBOL)
        if (!spec) {
          continue
        }

        const isTypeOnly = importDecl.isTypeOnly() || spec.isTypeOnly()
        const alias = spec.getAliasNode()?.getText()
        const existingLexical = findLexicalImport({ file, isTypeOnly })

        // When the import already contains nothing but `isHTMLElement` and there
        // is no `lexical` import to merge into, rewrite the specifier in place to
        // preserve the surrounding formatting.
        const isSoleImport =
          importDecl.getNamedImports().length === 1 &&
          !importDecl.getDefaultImport() &&
          !importDecl.getNamespaceImport()

        if (isSoleImport && !existingLexical) {
          importDecl.setModuleSpecifier(TARGET)
        } else {
          spec.remove()
          attachToLexicalImport({ alias, existing: existingLexical, file, isTypeOnly })
          removeIfEmpty(importDecl)
        }

        mutated = true
        movedAny = true
      }

      if (mutated) {
        filesChanged.add(file.getFilePath())
      }
    }

    return {
      filesChanged: [...filesChanged],
      ...(movedAny ? { notes: [INSTALL_WARNING] } : {}),
    }
  },
  description:
    'Rewrites imports of the removed `isHTMLElement` utility from `@payloadcms/richtext-lexical` (and `/client`) to its canonical source, `lexical`. Surfaces a note reminding users to install `lexical` as a dependency.',
}

function removeIfEmpty(importDecl: ImportDeclaration): void {
  if (
    importDecl.getNamedImports().length === 0 &&
    !importDecl.getDefaultImport() &&
    !importDecl.getNamespaceImport()
  ) {
    importDecl.remove()
  }
}

type FindLexicalArgs = {
  file: SourceFile
  isTypeOnly: boolean
}

function findLexicalImport({ file, isTypeOnly }: FindLexicalArgs): ImportDeclaration | undefined {
  return file
    .getImportDeclarations()
    .find((decl) => decl.getModuleSpecifierValue() === TARGET && decl.isTypeOnly() === isTypeOnly)
}

type AttachArgs = {
  alias?: string
  existing?: ImportDeclaration
  file: SourceFile
  isTypeOnly: boolean
}

function attachToLexicalImport({ alias, existing, file, isTypeOnly }: AttachArgs): void {
  const localName = alias ?? SYMBOL

  if (existing) {
    const alreadyHas = existing
      .getNamedImports()
      .some((named) => (named.getAliasNode()?.getText() ?? named.getName()) === localName)
    if (!alreadyHas) {
      existing.addNamedImport({ name: SYMBOL, alias })
    }
    return
  }

  file.addImportDeclaration({
    isTypeOnly,
    moduleSpecifier: TARGET,
    namedImports: [{ name: SYMBOL, alias }],
  })
}

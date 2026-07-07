import type { CallExpression, ObjectLiteralExpression, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Props on the old `slugField()` helper that map cleanly onto the native
 * `slug` field. Anything outside this set (notably `overrides`) can't be
 * migrated automatically, so the call is left untouched with a note.
 */
const KNOWN_ARGS = new Set([
  'checkboxName',
  'disableUnique',
  'fieldToUse',
  'localized',
  'name',
  'position',
  'required',
  'slugify',
  'useAsSlug',
])

const findSlugFieldLocalNames = (
  file: SourceFile,
): Map<string, ReturnType<SourceFile['getImportDeclarations']>[number]> => {
  const localNames = new Map<string, ReturnType<SourceFile['getImportDeclarations']>[number]>()

  for (const importDecl of file.getImportDeclarations()) {
    if (importDecl.getModuleSpecifierValue() !== 'payload') {
      continue
    }
    for (const spec of importDecl.getNamedImports()) {
      if (spec.getName() === 'slugField') {
        localNames.set(spec.getAliasNode()?.getText() ?? spec.getName(), importDecl)
      }
    }
  }

  return localNames
}

/**
 * Rewrite a `slugField(...)` call in place into a native `{ type: 'slug' }`
 * object literal. Returns false (leaving the call untouched) when an option
 * can't be mapped cleanly, so the caller can surface a note.
 */
const replaceCallWithSlugField = (
  call: CallExpression,
  arg: ObjectLiteralExpression | undefined,
): boolean => {
  const getInit = (name: string) =>
    arg?.getProperty(name)?.asKind(SyntaxKind.PropertyAssignment)?.getInitializer()?.getText()

  // Extract every value before mutating — replacing the call forgets `arg`.
  const name = getInit('name') ?? "'slug'"
  const useAsSlug = getInit('useAsSlug') ?? getInit('fieldToUse')
  const slugify = getInit('slugify')
  const required = getInit('required')
  const localized = getInit('localized')
  const position = getInit('position')
  const disableUnique = getInit('disableUnique')

  // `disableUnique: true` -> `unique: false`. Only a boolean literal maps cleanly.
  let unique: string | undefined
  if (disableUnique === 'true') {
    unique = 'false'
  } else if (disableUnique !== undefined && disableUnique !== 'false') {
    return false
  }

  const obj = call.replaceWithText('{}').asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  obj.addPropertyAssignment({ name: 'name', initializer: name })
  obj.addPropertyAssignment({ name: 'type', initializer: "'slug'" })
  if (useAsSlug !== undefined) {
    obj.addPropertyAssignment({ name: 'useAsSlug', initializer: useAsSlug })
  }
  if (slugify !== undefined) {
    obj.addPropertyAssignment({ name: 'slugify', initializer: slugify })
  }
  if (required !== undefined) {
    obj.addPropertyAssignment({ name: 'required', initializer: required })
  }
  if (localized !== undefined) {
    obj.addPropertyAssignment({ name: 'localized', initializer: localized })
  }
  if (unique !== undefined) {
    obj.addPropertyAssignment({ name: 'unique', initializer: unique })
  }
  if (position !== undefined) {
    obj.addPropertyAssignment({ name: 'admin', initializer: `{ position: ${position} }` })
  }

  return true
}

export const migrateSlugField: Transform = {
  name: 'migrate-slug-field',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const file of project.getSourceFiles()) {
      const localNames = findSlugFieldLocalNames(file)
      if (localNames.size === 0) {
        continue
      }

      let transformedInFile = false
      let remainingInFile = false

      const calls = file.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
        const expr = call.getExpression()
        return Node.isIdentifier(expr) && localNames.has(expr.getText())
      })

      for (const call of calls) {
        const args = call.getArguments()
        const arg = args[0]?.asKind(SyntaxKind.ObjectLiteralExpression)

        const hasUnsupportedArg =
          args.length > 1 ||
          (args[0] !== undefined && arg === undefined) ||
          (arg?.getProperties().some((prop) => {
            const named = prop.asKind(SyntaxKind.PropertyAssignment)
            return !named || !KNOWN_ARGS.has(named.getName())
          }) ??
            false)

        if (hasUnsupportedArg) {
          remainingInFile = true
          notes.push(
            `${file.getFilePath()}: a slugField() call uses options that can't be migrated automatically (e.g. 'overrides'). Convert it to a { type: 'slug' } field manually.`,
          )
          continue
        }

        const replaced = replaceCallWithSlugField(call, arg)
        if (!replaced) {
          remainingInFile = true
          notes.push(
            `${file.getFilePath()}: a slugField() call uses a non-literal 'disableUnique' value. Convert it to a { type: 'slug', unique: ... } field manually.`,
          )
          continue
        }

        transformedInFile = true
        filesChanged.add(file.getFilePath())
      }

      // Drop the `slugField` import only once no calls that need it remain.
      if (transformedInFile && !remainingInFile) {
        for (const importDecl of new Set(localNames.values())) {
          const slugSpec = importDecl
            .getNamedImports()
            .find((spec) => spec.getName() === 'slugField')
          slugSpec?.remove()

          if (
            importDecl.getNamedImports().length === 0 &&
            !importDecl.getDefaultImport() &&
            !importDecl.getNamespaceImport()
          ) {
            importDecl.remove()
          }
        }
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    "Convert the experimental slugField() helper to the native { type: 'slug' } field. Calls using 'overrides' or other unsupported options are left in place with a note.",
}

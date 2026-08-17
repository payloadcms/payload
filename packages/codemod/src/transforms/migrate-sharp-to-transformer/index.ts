import type { ArrayLiteralExpression, ObjectLiteralExpression, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const TRANSFORMER_MODULE = '@payloadcms/transformer-sharp'
const TRANSFORMER_NAME = 'sharpTransformer'

/** Fields moved from a collection's `upload` object into `sharpTransformer({ collections })`. */
const MOVED_UPLOAD_FIELDS = [
  'constructorOptions',
  'formatOptions',
  'resizeOptions',
  'trimOptions',
  'withMetadata',
  'imageSizes',
]

/** Fields copied (not removed) since core still reads them off the collection directly. */
const COPIED_UPLOAD_FIELDS = ['crop', 'focalPoint']

const findBuildConfigLocalNames = (file: SourceFile): Set<string> => {
  const localNames = new Set<string>()

  for (const importDecl of file.getImportDeclarations()) {
    if (importDecl.getModuleSpecifierValue() !== 'payload') {
      continue
    }
    for (const spec of importDecl.getNamedImports()) {
      if (spec.getName() === 'buildConfig') {
        localNames.add(spec.getAliasNode()?.getText() ?? spec.getName())
      }
    }
  }

  return localNames
}

function ensureSharpTransformerImport(sourceFile: SourceFile): void {
  const existing = sourceFile
    .getImportDeclarations()
    .find((decl) => decl.getModuleSpecifierValue() === TRANSFORMER_MODULE)

  if (!existing) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: TRANSFORMER_MODULE,
      namedImports: [TRANSFORMER_NAME],
    })
    return
  }

  const alreadyImported = existing
    .getNamedImports()
    .some((named) => named.getName() === TRANSFORMER_NAME)

  if (!alreadyImported) {
    existing.addNamedImport(TRANSFORMER_NAME)
  }
}

/**
 * Extracts Sharp-owned fields off one collection's `upload` object literal into
 * a `<slug>: { ... }` entry text for the `sharpTransformer({ collections })` map.
 * Returns `undefined` when the collection has nothing to migrate.
 */
function extractCollectionSharpEntry({
  collectionObj,
  filePath,
  notes,
}: {
  collectionObj: ObjectLiteralExpression
  filePath: string
  notes: string[]
}): string | undefined {
  const slugProp = collectionObj.getProperty('slug')
  const slugAssignment = slugProp?.asKind(SyntaxKind.PropertyAssignment)
  const slugInitializer = slugAssignment?.getInitializer()

  if (!slugInitializer) {
    return undefined
  }

  const uploadProp = collectionObj.getProperty('upload')
  if (!uploadProp || !Node.isPropertyAssignment(uploadProp)) {
    return undefined
  }

  const uploadObj = uploadProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
  if (!uploadObj) {
    if (uploadProp.getInitializer()?.getKind() !== SyntaxKind.TrueKeyword) {
      notes.push(
        `${filePath}: collection ${slugInitializer.getText()}'s \`upload\` option is not an inline object — check it for Sharp-specific fields (resizeOptions/imageSizes/formatOptions/trimOptions/constructorOptions/withMetadata) manually.`,
      )
    }
    return undefined
  }

  const movedTexts: string[] = []
  for (const name of MOVED_UPLOAD_FIELDS) {
    const prop = uploadObj.getProperty(name)
    if (prop && Node.isPropertyAssignment(prop)) {
      movedTexts.push(prop.print())
      prop.remove()
    }
  }

  const copiedTexts: string[] = []
  for (const name of COPIED_UPLOAD_FIELDS) {
    const prop = uploadObj.getProperty(name)
    if (prop && Node.isPropertyAssignment(prop)) {
      copiedTexts.push(prop.print())
    }
  }

  const allTexts = [...movedTexts, ...copiedTexts]
  if (allTexts.length === 0) {
    return undefined
  }

  return `[${slugInitializer.getText()}]: { ${allTexts.join(', ')} }`
}

/**
 * Builds every `<slug>: { ... }` entry for a `buildConfig({ collections })` array,
 * skipping (and, for a present `sharp` signal, noting) entries that aren't inline
 * object literals or whose `collections` array isn't statically analyzable.
 */
function extractSharpCollectionEntries({
  configObj,
  filePath,
  notes,
}: {
  configObj: ObjectLiteralExpression
  filePath: string
  notes: string[]
}): string[] {
  const collectionsProp = configObj.getProperty('collections')
  if (!collectionsProp || !Node.isPropertyAssignment(collectionsProp)) {
    return []
  }

  const arrayLiteral = collectionsProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
  if (!arrayLiteral) {
    notes.push(
      `${filePath}: \`collections\` isn't an inline array — check each collection for Sharp-specific \`upload\` fields (resizeOptions/imageSizes/formatOptions/trimOptions/constructorOptions/withMetadata) and move them into \`sharpTransformer({ collections })\` manually.`,
    )
    return []
  }

  const entries: string[] = []

  for (const el of arrayLiteral.getElements()) {
    if (!Node.isObjectLiteralExpression(el)) {
      notes.push(
        `${filePath}: a collection in \`collections\` is defined externally — check it for Sharp-specific \`upload\` fields and move them into \`sharpTransformer({ collections })\` manually.`,
      )
      continue
    }

    const entry = extractCollectionSharpEntry({ collectionObj: el, filePath, notes })
    if (entry) {
      entries.push(entry)
    }
  }

  return entries
}

function findSharpTransformerCall(transformersArray: ArrayLiteralExpression) {
  return transformersArray.getElements().find((el) => {
    if (!Node.isCallExpression(el)) {
      return false
    }
    const callee = el.getExpression()
    return Node.isIdentifier(callee) && callee.getText() === TRANSFORMER_NAME
  })
}

export const migrateSharpToTransformer: Transform = {
  name: 'migrate-sharp-to-transformer',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const buildConfigLocalNames = findBuildConfigLocalNames(sourceFile)
      if (buildConfigLocalNames.size === 0) {
        continue
      }

      const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
        const expr = call.getExpression()
        return Node.isIdentifier(expr) && buildConfigLocalNames.has(expr.getText())
      })

      for (const call of calls) {
        const [arg] = call.getArguments()
        const configObj = arg?.asKind(SyntaxKind.ObjectLiteralExpression)
        if (!configObj) {
          continue
        }

        const uploadProp = configObj.getProperty('upload')
        const uploadObj = uploadProp
          ?.asKind(SyntaxKind.PropertyAssignment)
          ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
        const existingTransformersProp = uploadObj?.getProperty('transformers')
        const existingTransformersArray = existingTransformersProp
          ?.asKind(SyntaxKind.PropertyAssignment)
          ?.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)

        if (existingTransformersArray && findSharpTransformerCall(existingTransformersArray)) {
          // Already migrated.
          continue
        }

        const sharpProp = configObj.getProperty('sharp')
        let sharpExpressionText: string | undefined
        if (sharpProp && Node.isPropertyAssignment(sharpProp)) {
          sharpExpressionText = sharpProp.getInitializer()?.getText()
        } else if (sharpProp && Node.isShorthandPropertyAssignment(sharpProp)) {
          sharpExpressionText = sharpProp.getName()
        }

        // Remove `sharp` before extracting collection entries — later removals
        // shift node positions, and ts-morph node references taken before a
        // sibling removal can go stale.
        sharpProp?.remove()

        const collectionEntries = extractSharpCollectionEntries({
          configObj,
          filePath: sourceFile.getFilePath(),
          notes,
        })

        if (!sharpExpressionText && collectionEntries.length === 0) {
          continue
        }

        const transformerArgs: string[] = []
        if (sharpExpressionText) {
          transformerArgs.push(`sharp: ${sharpExpressionText}`)
        }
        if (collectionEntries.length > 0) {
          transformerArgs.push(`collections: { ${collectionEntries.join(', ')} }`)
        }

        const transformerCallText = `${TRANSFORMER_NAME}({ ${transformerArgs.join(', ')} })`

        if (existingTransformersArray) {
          existingTransformersArray.addElement(transformerCallText)
        } else if (uploadObj) {
          uploadObj.addPropertyAssignment({
            name: 'transformers',
            initializer: `[${transformerCallText}]`,
          })
        } else if (uploadProp && Node.isPropertyAssignment(uploadProp)) {
          notes.push(
            `${sourceFile.getFilePath()}: \`upload\` isn't an inline object — add \`transformers: [${transformerCallText}]\` to it manually.`,
          )
        } else {
          configObj.addPropertyAssignment({
            name: 'upload',
            initializer: `{ transformers: [${transformerCallText}] }`,
          })
        }

        ensureSharpTransformerImport(sourceFile)
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    if (filesChanged.size > 0) {
      notes.push(
        `Install the new dependency this migration relies on: pnpm add @payloadcms/transformer-sharp`,
      )
    }

    return { filesChanged: Array.from(filesChanged), notes: notes.length ? notes : undefined }
  },
  description:
    'Move a top-level `sharp` dependency and per-collection Sharp-specific `upload` options (resizeOptions, imageSizes, formatOptions, trimOptions, constructorOptions, withMetadata) into `sharpTransformer({ collections })`, registered under `upload.transformers`.',
}

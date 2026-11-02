import type {
  ArrayLiteralExpression,
  Expression,
  Identifier,
  Symbol as MorphSymbol,
  ObjectLiteralExpression,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SourceFile,
  StringLiteral,
} from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const TRANSFORMER_MODULE = '@payloadcms/transformer-sharp'
const TRANSFORMER_NAME = 'sharpTransformer'
const VARIANTS_KEY = 'variants'

const IDENTIFIER_PATTERN = /^[A-Z_$][\w$]*$/i
/** Whether `value` can be used as a plain (unquoted, non-bracketed) object literal key. */
function isSafePlainObjectKey(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value)
}

/** Fields moved from a collection's `upload` object into `sharpTransformer({ collections })`. */
const MOVED_UPLOAD_FIELDS = [
  'constructorOptions',
  'formatOptions',
  'resizeOptions',
  'trimOptions',
  'withMetadata',
  'imageSizes',
  'crop',
  'focalPoint',
]

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

type SharpTransformerBinding = {
  /** Whether `localName` is a value import of `sharpTransformer` from `@payloadcms/transformer-sharp`. */
  isImported: boolean
  /** The identifier `sharpTransformer` is (or will be) called through in this file. */
  localName: string
}

/**
 * Resolves the local binding of the imported `sharpTransformer`, honoring an alias such as
 * `import { sharpTransformer as st }`. When it isn't imported yet, picks a name no other
 * identifier in the file uses, so a local `sharpTransformer` function is never mistaken for it.
 */
function resolveSharpTransformerBinding(sourceFile: SourceFile): SharpTransformerBinding {
  const namedImports = sourceFile
    .getImportDeclarations()
    .filter((decl) => decl.getModuleSpecifierValue() === TRANSFORMER_MODULE && !decl.isTypeOnly())
    .flatMap((decl) => decl.getNamedImports())
    .filter((named) => named.getName() === TRANSFORMER_NAME && !named.isTypeOnly())

  const unaliasedImport = namedImports.find((named) => !named.getAliasNode())
  const aliasedImport = namedImports.find((named) => named.getAliasNode())

  if (unaliasedImport) {
    return { isImported: true, localName: TRANSFORMER_NAME }
  }

  if (aliasedImport) {
    return { isImported: true, localName: aliasedImport.getAliasNode()!.getText() }
  }

  const usedIdentifiers = new Set(
    sourceFile
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .map((identifier) => identifier.getText()),
  )

  let localName = TRANSFORMER_NAME
  for (let suffix = 2; usedIdentifiers.has(localName); suffix++) {
    localName = `${TRANSFORMER_NAME}${suffix}`
  }

  return { isImported: false, localName }
}

function ensureSharpTransformerImport({
  localName,
  sourceFile,
}: {
  localName: string
  sourceFile: SourceFile
}): void {
  const namedImport =
    localName === TRANSFORMER_NAME ? TRANSFORMER_NAME : { name: TRANSFORMER_NAME, alias: localName }

  const existing = sourceFile
    .getImportDeclarations()
    .find((decl) => decl.getModuleSpecifierValue() === TRANSFORMER_MODULE && !decl.isTypeOnly())

  if (!existing) {
    const otherImports = sourceFile.getImportDeclarations()
    const fileOmitsSemicolonsOnImports =
      otherImports.length > 0 && otherImports.every((decl) => !decl.getText().endsWith(';'))

    const insertedImport = sourceFile.addImportDeclaration({
      moduleSpecifier: TRANSFORMER_MODULE,
      namedImports: [namedImport],
    })

    // ts-morph always appends a semicolon; strip it when the file's other imports don't use them.
    if (fileOmitsSemicolonsOnImports) {
      const insertedImportText = insertedImport.getText()
      if (insertedImportText.endsWith(';')) {
        insertedImport.replaceWithText(insertedImportText.slice(0, -1))
      }
    }

    return
  }

  const alreadyImported = existing
    .getNamedImports()
    .some(
      (named) =>
        named.getName() === TRANSFORMER_NAME &&
        !named.isTypeOnly() &&
        (named.getAliasNode()?.getText() ?? TRANSFORMER_NAME) === localName,
    )

  if (!alreadyImported) {
    existing.addNamedImport(namedImport)
  }
}

type CollectionSharpEntry = {
  /** `<slug>: { ... }` text for the `sharpTransformer({ collections })` map. */
  entryText: string
  /** Moved properties, removed from the collection only once `sharpTransformer` is registered. */
  movedProps: (PropertyAssignment | ShorthandPropertyAssignment)[]
  uploadObj: ObjectLiteralExpression
}

/**
 * Reads Sharp-owned fields off one collection's `upload` object literal into
 * a `<slug>: { ... }` entry text for the `sharpTransformer({ collections })` map,
 * without modifying the collection. Returns `undefined` when the collection has nothing to migrate.
 */
function extractCollectionSharpEntry({
  collectionObj,
  configFile,
  notes,
}: {
  collectionObj: ObjectLiteralExpression
  /** The file the `sharpTransformer` call is written to; a collection declared elsewhere is moved across files. */
  configFile: SourceFile
  notes: string[]
}): CollectionSharpEntry | undefined {
  const filePath = collectionObj.getSourceFile().getFilePath()
  const isExternal = collectionObj.getSourceFile() !== configFile
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
        `${filePath}: collection ${slugInitializer.getText()}'s \`upload\` option is not an inline object — check it for Sharp-specific fields (resizeOptions/imageSizes/formatOptions/trimOptions/constructorOptions/withMetadata/crop/focalPoint) manually.`,
      )
    }
    return undefined
  }

  const uploadHasSpread = uploadObj.getProperties().some((prop) => Node.isSpreadAssignment(prop))
  if (uploadHasSpread) {
    notes.push(
      `${filePath}: collection ${slugInitializer.getText()}'s \`upload\` object contains a spread — Sharp-specific fields (resizeOptions/imageSizes/formatOptions/trimOptions/constructorOptions/withMetadata/crop/focalPoint) hidden inside it need manual review.`,
    )
  }

  const movedTexts: string[] = []
  const movedProps: CollectionSharpEntry['movedProps'] = []
  for (const name of MOVED_UPLOAD_FIELDS) {
    const prop = uploadObj.getProperty(name)
    if (!prop) {
      continue
    }

    // A shorthand `imageSizes` reads the same binding from `buildConfig`'s argument,
    // where the `sharpTransformer` call is inserted, so it moves verbatim.
    if (Node.isPropertyAssignment(prop) || Node.isShorthandPropertyAssignment(prop)) {
      const localReference = isExternal ? findLocalReference({ node: prop }) : undefined

      // Moving the text into the config file would leave this reference unresolved there.
      if (localReference) {
        notes.push(
          `${filePath}: collection ${slugInitializer.getText()}'s \`upload.${name}\` refers to \`${localReference.getText()}\`, which isn't available in ${configFile.getFilePath()} — move this collection's Sharp-specific \`upload\` fields into \`sharpTransformer({ collections })\` manually.`,
        )
        return undefined
      }

      movedTexts.push(name === 'imageSizes' ? printAsVariants(prop) : prop.print())
      movedProps.push(prop)
      continue
    }

    notes.push(
      `${filePath}: collection ${slugInitializer.getText()}'s \`upload.${name}\` isn't a plain property — move it into \`sharpTransformer({ collections })\` manually.`,
    )
  }

  if (movedTexts.length === 0) {
    return undefined
  }

  const slugLiteralValue = getSlugLiteralValue({ isExternal, slugInitializer })

  if (isExternal && slugLiteralValue === undefined) {
    notes.push(
      `${filePath}: collection ${slugInitializer.getText()}'s slug isn't a string constant — move its Sharp-specific \`upload\` fields into \`sharpTransformer({ collections })\` manually.`,
    )
    return undefined
  }

  // A slug constant from another file isn't in scope in the config file, so it's keyed by value.
  const keyText =
    slugLiteralValue !== undefined && isSafePlainObjectKey(slugLiteralValue)
      ? slugLiteralValue
      : isExternal && !isStringLiteralNode(slugInitializer)
        ? `'${slugLiteralValue!.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
        : `[${slugInitializer.getText()}]`

  return { entryText: `${keyText}: { ${movedTexts.join(', ')} }`, movedProps, uploadObj }
}

function isStringLiteralNode(node: Node): boolean {
  return Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)
}

/**
 * A slug written as a string literal or, for a collection in another file, a constant whose
 * type is a string literal (e.g. `slug: mediaSlug` with `const mediaSlug = 'media'`).
 */
function getSlugLiteralValue({
  isExternal,
  slugInitializer,
}: {
  isExternal: boolean
  slugInitializer: Expression
}): string | undefined {
  if (isStringLiteralNode(slugInitializer)) {
    return (slugInitializer as StringLiteral).getLiteralValue()
  }

  if (!isExternal) {
    return undefined
  }

  const slugType = slugInitializer.getType()

  return slugType.isStringLiteral() ? (slugType.getLiteralValue() as string) : undefined
}

/**
 * The first identifier inside `node` bound to a declaration elsewhere in the project, such as an
 * import or a local variable. Declarations inside `node` itself (parameters, its own property
 * names) and ambient/library ones (`undefined`, `Math`) don't count.
 */
function findLocalReference({ node }: { node: Node }): Identifier | undefined {
  const sourceFile = node.getSourceFile()

  return node.getDescendantsOfKind(SyntaxKind.Identifier).find((identifier) =>
    (identifier.getSymbol()?.getDeclarations() ?? []).some((declaration) => {
      const declarationFile = declaration.getSourceFile()

      if (declarationFile.isDeclarationFile() || declarationFile.isFromExternalLibrary()) {
        return false
      }

      return (
        declarationFile !== sourceFile ||
        declaration.getPos() < node.getPos() ||
        declaration.getEnd() > node.getEnd()
      )
    }),
  )
}

/**
 * Follows a `collections` array element written as an identifier (usually an imported
 * collection, e.g. `import { Media } from './collections/Media'`) to the object literal it's
 * declared as, unwrapping `satisfies`/`as`/parentheses. Returns `undefined` for anything else,
 * such as a factory call.
 */
function resolveCollectionObject({
  expression,
}: {
  expression: Node
}): ObjectLiteralExpression | undefined {
  let current: Node | undefined = expression

  for (let depth = 0; current && depth < 5; depth++) {
    while (
      Node.isSatisfiesExpression(current) ||
      Node.isAsExpression(current) ||
      Node.isParenthesizedExpression(current)
    ) {
      current = current.getExpression()
    }

    if (Node.isObjectLiteralExpression(current)) {
      return current
    }

    if (!Node.isIdentifier(current)) {
      return undefined
    }

    const symbol: MorphSymbol | undefined = current.getSymbol()
    const declaration: Node | undefined = (
      symbol?.isAlias() ? symbol.getAliasedSymbol() : symbol
    )?.getDeclarations()[0]

    if (Node.isVariableDeclaration(declaration)) {
      current = declaration.getInitializer()
    } else if (Node.isExportAssignment(declaration)) {
      current = declaration.getExpression()
    } else {
      return undefined
    }
  }

  return undefined
}

function removeMovedCollectionProps({ movedProps, uploadObj }: CollectionSharpEntry): void {
  for (const prop of movedProps) {
    prop.remove()
  }

  // Avoid leaving `upload: {\n}` spread across two lines once every property moves out.
  if (uploadObj.getProperties().length === 0) {
    uploadObj.replaceWithText('{}')
  }
}

/**
 * Builds every `<slug>: { ... }` entry for a `buildConfig({ collections })` array,
 * skipping (and, for a present `sharp` signal, noting) entries that aren't inline
 * object literals or whose `collections` array isn't statically analyzable.
 */
function extractSharpCollectionEntries({
  configObj,
  notes,
}: {
  configObj: ObjectLiteralExpression
  notes: string[]
}): CollectionSharpEntry[] {
  const configFile = configObj.getSourceFile()
  const filePath = configFile.getFilePath()
  const collectionsProp = configObj.getProperty('collections')
  if (!collectionsProp || !Node.isPropertyAssignment(collectionsProp)) {
    return []
  }

  const arrayLiteral = collectionsProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
  if (!arrayLiteral) {
    notes.push(
      `${filePath}: \`collections\` isn't an inline array — check each collection for Sharp-specific \`upload\` fields (resizeOptions/imageSizes/formatOptions/trimOptions/constructorOptions/withMetadata/crop/focalPoint) and move them into \`sharpTransformer({ collections })\` manually.`,
    )
    return []
  }

  const entries: CollectionSharpEntry[] = []

  for (const el of arrayLiteral.getElements()) {
    const collectionObj = resolveCollectionObject({ expression: el })

    if (!collectionObj) {
      notes.push(
        `${filePath}: a collection in \`collections\` (\`${el.getText()}\`) is defined externally — check it for Sharp-specific \`upload\` fields and move them into \`sharpTransformer({ collections })\` manually.`,
      )
      continue
    }

    const entry = extractCollectionSharpEntry({ collectionObj, configFile, notes })
    if (entry) {
      entries.push(entry)
    }
  }

  return entries
}

/** `sharpTransformer` authors image sizes as `variants`; the collection's `imageSizes` is renamed on the way in. */
function printAsVariants(prop: PropertyAssignment | ShorthandPropertyAssignment): string {
  return Node.isShorthandPropertyAssignment(prop)
    ? `${VARIANTS_KEY}: ${prop.getName()}`
    : `${VARIANTS_KEY}: ${prop.getInitializerOrThrow().print()}`
}

/**
 * Renames `imageSizes` to `variants` inside every inline `sharpTransformer({ collections })`
 * entry in the file — configs migrated before `variants` existed. Returns whether it changed
 * anything.
 */
function renameImageSizesInSharpTransformerCalls({
  notes,
  sourceFile,
  transformerLocalName,
}: {
  notes: string[]
  sourceFile: SourceFile
  transformerLocalName: string
}): boolean {
  let hasChanged = false

  const sharpTransformerCalls = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => {
      const callee = call.getExpression()
      return Node.isIdentifier(callee) && callee.getText() === transformerLocalName
    })

  for (const call of sharpTransformerCalls) {
    const collectionsObj = call
      .getArguments()[0]
      ?.asKind(SyntaxKind.ObjectLiteralExpression)
      ?.getProperty('collections')
      ?.asKind(SyntaxKind.PropertyAssignment)
      ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)

    for (const entry of collectionsObj?.getProperties() ?? []) {
      const entryObj = Node.isPropertyAssignment(entry)
        ? entry.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
        : undefined

      if (!entryObj) {
        notes.push(
          `${sourceFile.getFilePath()}: a \`${TRANSFORMER_NAME}({ collections })\` entry isn't an inline object — rename any \`imageSizes\` in it to \`${VARIANTS_KEY}\` manually.`,
        )
        continue
      }

      const imageSizesProp = entryObj.getProperty('imageSizes')

      if (imageSizesProp && Node.isPropertyAssignment(imageSizesProp)) {
        imageSizesProp.getNameNode().replaceWithText(VARIANTS_KEY)
        hasChanged = true
      } else if (imageSizesProp && Node.isShorthandPropertyAssignment(imageSizesProp)) {
        imageSizesProp.replaceWithText(printAsVariants(imageSizesProp))
        hasChanged = true
      }
    }
  }

  return hasChanged
}

function findSharpTransformerCall({
  transformerLocalName,
  transformersArray,
}: {
  transformerLocalName: string
  transformersArray: ArrayLiteralExpression
}) {
  return transformersArray.getElements().find((el) => {
    if (!Node.isCallExpression(el)) {
      return false
    }
    const callee = el.getExpression()
    return Node.isIdentifier(callee) && callee.getText() === transformerLocalName
  })
}

export const migrateSharpToTransformer: Transform = {
  name: 'migrate-sharp-to-transformer',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const { isImported, localName: transformerLocalName } =
        resolveSharpTransformerBinding(sourceFile)

      if (
        isImported &&
        renameImageSizesInSharpTransformerCalls({ notes, sourceFile, transformerLocalName })
      ) {
        filesChanged.add(sourceFile.getFilePath())
      }

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
          notes.push(
            `${sourceFile.getFilePath()}: \`buildConfig\` argument is not an inline object literal — check it manually for a top-level \`sharp\` dependency and per-collection Sharp-specific \`upload\` options.`,
          )
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

        if (
          existingTransformersArray &&
          findSharpTransformerCall({
            transformerLocalName,
            transformersArray: existingTransformersArray,
          })
        ) {
          // Already migrated, but a leftover `sharp` property would fail a later
          // type-check with no signal from this codemod — flag it here.
          if (configObj.getProperty('sharp')) {
            notes.push(
              `${sourceFile.getFilePath()}: a top-level \`sharp\` property remains even though \`sharpTransformer\` is already registered — move any value you still need into the existing \`sharpTransformer\` call, then remove \`sharp\` manually.`,
            )
          }
          continue
        }

        const sharpProp = configObj.getProperty('sharp')
        let sharpExpressionText: string | undefined
        if (sharpProp && Node.isPropertyAssignment(sharpProp)) {
          sharpExpressionText = sharpProp.getInitializer()?.getText()
        } else if (sharpProp && Node.isShorthandPropertyAssignment(sharpProp)) {
          sharpExpressionText = sharpProp.getName()
        }

        const collectionEntries = extractSharpCollectionEntries({ configObj, notes })

        if (!sharpExpressionText && collectionEntries.length === 0) {
          continue
        }

        const transformerArgs: string[] = []
        if (sharpExpressionText) {
          transformerArgs.push(
            sharpExpressionText === 'sharp' ? 'sharp' : `sharp: ${sharpExpressionText}`,
          )
        }
        if (collectionEntries.length > 0) {
          transformerArgs.push(
            `collections: { ${collectionEntries.map((entry) => entry.entryText).join(', ')} }`,
          )
        }

        const transformerCallText = `${transformerLocalName}({ ${transformerArgs.join(', ')} })`

        // Adding a `transformers` property next to a non-array one, or after a spread
        // that may already set it, would create a duplicate key whose last value wins
        // at runtime — silently dropping the existing transformers.
        const uploadHasSpread = uploadObj
          ?.getProperties()
          .some((prop) => Node.isSpreadAssignment(prop))

        // The old settings are only removed once the replacement call is registered —
        // otherwise the migrated config would silently lose its image processing.
        let isRegistered = true

        if (existingTransformersArray) {
          existingTransformersArray.addElement(transformerCallText)
        } else if (existingTransformersProp) {
          isRegistered = false
          notes.push(
            `${sourceFile.getFilePath()}: \`upload.transformers\` isn't an inline array — add \`${transformerCallText}\` to it manually, then remove the migrated Sharp settings.`,
          )
        } else if (uploadHasSpread) {
          isRegistered = false
          notes.push(
            `${sourceFile.getFilePath()}: \`upload\` contains a spread that may already set \`transformers\` — add \`${transformerCallText}\` to its transformers manually, then remove the migrated Sharp settings.`,
          )
        } else if (uploadObj) {
          uploadObj.addPropertyAssignment({
            name: 'transformers',
            initializer: `[${transformerCallText}]`,
          })
        } else if (uploadProp) {
          isRegistered = false
          notes.push(
            `${sourceFile.getFilePath()}: \`upload\` isn't an inline object — add \`transformers: [${transformerCallText}]\` to it manually, then remove the migrated Sharp settings.`,
          )
        } else {
          configObj.addPropertyAssignment({
            name: 'upload',
            initializer: `{ transformers: [${transformerCallText}] }`,
          })
        }

        if (!isRegistered) {
          continue
        }

        sharpProp?.remove()
        for (const entry of collectionEntries) {
          removeMovedCollectionProps(entry)
          filesChanged.add(entry.uploadObj.getSourceFile().getFilePath())
        }

        ensureSharpTransformerImport({ localName: transformerLocalName, sourceFile })
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
    'Move a top-level `sharp` dependency and per-collection Sharp-specific `upload` options (resizeOptions, imageSizes, formatOptions, trimOptions, constructorOptions, withMetadata, crop, focalPoint) into `sharpTransformer({ collections })`, registered under `upload.transformers`, with `imageSizes` renamed to `variants`. Also renames `imageSizes` to `variants` in existing `sharpTransformer({ collections })` entries.',
}

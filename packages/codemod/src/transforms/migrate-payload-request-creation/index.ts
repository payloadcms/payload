import type { CallExpression, ImportSpecifier, TypeReferenceNode } from 'ts-morph'

import { Node, SymbolFlags, SyntaxKind, VariableDeclarationKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const RENAMES = {
  payload: {
    createLocalReq: 'createPayloadRequest',
    CreateLocalReqOptions: 'CreatePayloadRequestArgs',
    createPayloadRequest: 'createPayloadRequestFromWebRequest',
    InitReqResult: 'AdminContext',
  },
  'payload/internal': {
    initReq: 'initAdminContext',
    InitReqArgs: 'InitAdminContextArgs',
    InitReqCache: 'AdminContextCache',
    InitReqPartialResult: 'PartialAdminContext',
  },
} as const

const OPTION_NAMES = [
  'context',
  'depth',
  'fallbackLocale',
  'locale',
  'req',
  'urlSuffix',
  'user',
] as const

const getImportPriority = (name: string): number => {
  if (name === 'createPayloadRequest') {
    return 0
  }

  if (name === 'CreateLocalReqOptions') {
    return 2
  }

  return 1
}

export const migratePayloadRequestCreation: Transform = {
  name: 'migrate-payload-request-creation',
  apply: ({ project }) => {
    const originals = new Map(project.getSourceFiles().map((file) => [file, file.getFullText()]))
    const notes: string[] = []

    for (const file of project.getSourceFiles()) {
      // Check call options before replacing type imports that may only resolve after upgrading Payload.
      const imports = file
        .getImportDeclarations()
        .flatMap((declaration) =>
          declaration
            .getNamedImports()
            .map((spec) => ({ source: declaration.getModuleSpecifierValue(), spec })),
        )
        .sort((a, b) => getImportPriority(a.spec.getName()) - getImportPriority(b.spec.getName()))

      for (const { source, spec } of imports) {
        if (source !== 'payload' && (source.startsWith('.') || source.startsWith('payload/'))) {
          if (spec.getName() === 'CreateLocalReqOptions') {
            notes.push(
              `${file.getFilePath()}: Unsupported CreateLocalReqOptions import source \`${source}\`; migrate this private/relative type import manually to Omit<CreatePayloadRequestArgs, 'payload'> from payload.`,
            )
          }
        }

        if (!Object.hasOwn(RENAMES, source)) {
          continue
        }

        const renames: Record<string, string> = RENAMES[source as keyof typeof RENAMES]

        const importedName = spec.getName()
        const aliasName = spec.getAliasNode()?.getText()
        const isAliasedExportMigrationArtifact =
          source === 'payload' &&
          importedName === 'createPayloadRequestFromWebRequest' &&
          aliasName === 'createPayloadRequest'
        const originalName = isAliasedExportMigrationArtifact ? aliasName : importedName

        if (!Object.hasOwn(renames, originalName)) {
          continue
        }

        const newName = renames[originalName]!
        const hadAlias = Boolean(spec.getAliasNode())

        // An explicit alias limits ts-morph references and renames to this local binding.
        // Renaming an unaliased import can also rename the dependency's export.
        if (!hadAlias) {
          spec.setAlias(originalName)
        }

        const binding = spec.getAliasNode()!
        const references = binding.findReferencesAsNodes().filter((node) => node !== binding)
        const isCurrentPayloadRequestCreator =
          source === 'payload' &&
          importedName === 'createPayloadRequest' &&
          !isAliasedExportMigrationArtifact &&
          references.length > 0 &&
          references.every(isPayloadRequestCreationReference)

        if (isCurrentPayloadRequestCreator) {
          if (!hadAlias) {
            spec.removeAlias()
          }
          continue
        }

        const hasCollision =
          (!hadAlias || isAliasedExportMigrationArtifact) &&
          [binding, ...references].some((node) =>
            node
              .getSymbolsInScope(SymbolFlags.Value | SymbolFlags.Type | SymbolFlags.Alias)
              .some((symbol) => symbol.getName() === newName),
          )

        if (hasCollision) {
          notes.push(
            `${file.getFilePath()}: Skipped \`${binding.getText()}\`: binding collision with \`${newName}\`; migrate manually.`,
          )
          if (!hadAlias) {
            spec.removeAlias()
          }
          continue
        }

        const calls: CallExpression[] = []
        const optionsTypes: TypeReferenceNode[] = []
        let hasUnsupportedUse = false

        if (source === 'payload' && originalName === 'CreateLocalReqOptions') {
          for (const reference of references) {
            const parent = reference.getParent()
            const omitSymbol = reference
              .getSymbolsInScope(SymbolFlags.Type | SymbolFlags.Alias)
              .find((symbol) => symbol.getName() === 'Omit')
            const isOmitShadowed = omitSymbol
              ?.getDeclarations()
              .some((node) => node.getSourceFile().getBaseName() !== 'lib.es5.d.ts')

            if (
              Node.isTypeReference(parent) &&
              parent.getTypeName() === reference &&
              parent.getTypeArguments().length === 0 &&
              !isOmitShadowed
            ) {
              optionsTypes.push(parent)
            } else {
              hasUnsupportedUse = true
              notes.push(
                `${reference.getSourceFile().getFilePath()}:${reference.getStartLineNumber()}: Unsupported CreateLocalReqOptions usage \`${parent?.getText() ?? reference.getText()}\` or shadowed Omit type; left the import and all its uses unchanged. Migrate manually to an options-only type.`,
              )
            }
          }
        }

        if (source === 'payload' && originalName === 'createLocalReq') {
          for (const reference of references) {
            const parent = reference.getParent()

            if (
              Node.isCallExpression(parent) &&
              parent.getExpression() === reference &&
              !parent.getQuestionDotTokenNode() &&
              parent.getArguments().length === 2 &&
              !parent.getArguments().some(Node.isSpreadElement)
            ) {
              const [optionsArgument, payloadArgument] = parent.getArguments()
              const unsafeOptionsReason = getUnsafeOptionsReason({ options: optionsArgument! })

              if (!Node.isIdentifier(payloadArgument)) {
                hasUnsupportedUse = true
                notes.push(
                  `${reference.getSourceFile().getFilePath()}:${reference.getStartLineNumber()}: Unsupported payload argument \`${payloadArgument!.getText()}\` in \`${parent.getText()}\`: automatic migration cannot preserve evaluation order. Left the import and all its uses unchanged; migrate manually.`,
                )
              } else if (unsafeOptionsReason) {
                hasUnsupportedUse = true
                notes.push(
                  `${reference.getSourceFile().getFilePath()}:${reference.getStartLineNumber()}: Unsupported options argument \`${optionsArgument!.getText()}\` in \`${parent.getText()}\`: ${unsafeOptionsReason}. Left the import and all its uses unchanged; migrate manually.`,
                )
              } else {
                calls.push(parent)
              }
            } else {
              hasUnsupportedUse = true
              notes.push(
                `${reference.getSourceFile().getFilePath()}:${reference.getStartLineNumber()}: Unsupported use of \`${binding.getText()}\`: \`${parent?.getText() ?? reference.getText()}\`. Left the import and all its uses unchanged; migrate manually.`,
              )
            }
          }
        }

        if (hasUnsupportedUse) {
          if (!hadAlias) {
            spec.removeAlias()
          }
          continue
        }

        renameImport({ hadAlias, isAliasedExportMigrationArtifact, newName, spec })

        for (const optionsType of optionsTypes.sort((a, b) => b.getStart() - a.getStart())) {
          optionsType.replaceWithText(`Omit<${optionsType.getText()}, 'payload'>`)
        }

        // Inner calls must be rewritten before replacing an enclosing call's text.
        for (const call of calls.sort((a, b) => b.getStart() - a.getStart())) {
          rewriteCall({ call })
        }
      }
    }

    return {
      filesChanged: [...originals]
        .filter(([file, original]) => file.getFullText() !== original)
        .map(([file]) => file.getFilePath()),
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Renames Payload request and admin-context imports, preserves options-only types, and migrates safe createLocalReq calls by capturing payload before projecting the seven old option properties; reports unsupported bindings for manual migration.',
}

function isPayloadRequestCreationReference(reference: Node): boolean {
  const parent = reference.getParent()

  if (
    !Node.isCallExpression(parent) ||
    parent.getExpression() !== reference ||
    parent.getArguments().length !== 1
  ) {
    return false
  }

  const [argument] = parent.getArguments()

  return Node.isObjectLiteralExpression(argument) && Boolean(argument.getProperty('payload'))
}

function getUnsafeOptionsReason({ options }: { options: Node }): string | undefined {
  if (Node.isObjectLiteralExpression(options)) {
    return options.getProperties().length === 0
      ? undefined
      : 'only an empty inline options object can be migrated safely'
  }

  if (!Node.isIdentifier(options)) {
    return 'expected {} or a stable local const options identifier to preserve option reads and evaluation order'
  }

  const declarations = options.getSymbol()?.getDeclarations()
  const declaration = declarations?.length === 1 ? declarations[0] : undefined

  const isStable =
    Node.isVariableDeclaration(declaration) &&
    declaration.getSourceFile() === options.getSourceFile() &&
    Node.isIdentifier(declaration.getNameNode()) &&
    Boolean(declaration.getInitializer()) &&
    declaration.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const

  if (!isStable) {
    return 'the options identifier must resolve to an initialized local const binding so getters cannot change the receiver between property reads'
  }

  const type = options.getType()
  const missing = type.isAny() ? [] : OPTION_NAMES.filter((name) => !type.getProperty(name))

  if (missing.length > 0) {
    return `the options type does not expose ${missing.join(', ')}; projecting these properties would be unsafe for typechecking`
  }

  return undefined
}

function renameImport({
  hadAlias,
  isAliasedExportMigrationArtifact,
  newName,
  spec,
}: {
  hadAlias: boolean
  isAliasedExportMigrationArtifact: boolean
  newName: string
  spec: ImportSpecifier
}): void {
  if (isAliasedExportMigrationArtifact) {
    spec.getAliasNode()!.rename(newName, { usePrefixAndSuffixText: true })
    spec.removeAlias()
  } else if (hadAlias) {
    spec.setName(newName)
  } else {
    spec.getAliasNode()!.rename(newName, { usePrefixAndSuffixText: true })
    spec.setName(newName)
    spec.removeAlias()
  }
}

function rewriteCall({ call }: { call: CallExpression }): void {
  const [options, payload] = call.getArguments()
  const open = call.getFirstChildByKindOrThrow(SyntaxKind.OpenParenToken)
  const close = call.getLastChildByKindOrThrow(SyntaxKind.CloseParenToken)
  const commas = options!
    .getParentSyntaxListOrThrow()
    .getChildren()
    .filter((node) => node.getKind() === SyntaxKind.CommaToken)
  const comma = commas[0]!
  const trailingComma = commas[1]
  const text = call.getSourceFile().getFullText()
  const isEmpty = Node.isObjectLiteralExpression(options) && options.getProperties().length === 0
  const prefix = [
    text.slice(open.getEnd(), options!.getStart()),
    isEmpty ? options.getText().slice(1, -1) : '',
    text.slice(options!.getEnd(), comma.getStart()),
    text.slice(comma.getEnd(), payload!.getStart()),
  ].join('')
  // Forward reads into the async helper so throwing option getters still reject its promise.
  const contents = [
    prefix.trim() ? prefix : ' ',
    'payload: ',
    payload!.getText(),
    text.slice(payload!.getEnd(), trailingComma?.getStart() ?? close.getStart()),
    isEmpty
      ? ''
      : `, ${OPTION_NAMES.map((name) => `get ${name}() { return ${options!.getText()}.${name} }`).join(', ')}`,
    trailingComma ? text.slice(trailingComma.getStart(), close.getStart()) : ' ',
  ].join('')

  call.replaceWithText(
    `${text.slice(call.getStart(), open.getEnd())}{${contents}}${text.slice(close.getStart(), call.getEnd())}`,
  )
}

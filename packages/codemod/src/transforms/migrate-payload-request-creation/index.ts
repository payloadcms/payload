import type { CallExpression, ImportSpecifier } from 'ts-morph'

import { Node, SymbolFlags, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const RENAMES = {
  payload: {
    createLocalReq: 'createPayloadReq',
    CreateLocalReqOptions: 'CreatePayloadReqArgs',
    createPayloadRequest: 'createPayloadReqFromWebRequest',
    InitReqResult: 'GetAdminContextResult',
  },
  'payload/internal': {
    initReq: 'getAdminContext',
    InitReqArgs: 'GetAdminContextArgs',
    InitReqCache: 'AdminContextCache',
    InitReqPartialResult: 'PartialAdminContext',
  },
} as const

export const migratePayloadRequestCreation: Transform = {
  name: 'migrate-payload-request-creation',
  apply: ({ project }) => {
    const originals = new Map(project.getSourceFiles().map((file) => [file, file.getFullText()]))
    const notes: string[] = []

    for (const file of project.getSourceFiles()) {
      for (const declaration of file.getImportDeclarations()) {
        const source = declaration.getModuleSpecifierValue()
        if (!Object.hasOwn(RENAMES, source)) {
          continue
        }

        const renames: Record<string, string> = RENAMES[source as keyof typeof RENAMES]

        for (const spec of declaration.getNamedImports()) {
          const originalName = spec.getName()

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
          const hasCollision =
            !hadAlias &&
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
          let hasUnsupportedUse = false

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
                const payloadArgument = parent.getArguments()[1]!

                if (Node.isIdentifier(payloadArgument)) {
                  calls.push(parent)
                } else {
                  hasUnsupportedUse = true
                  notes.push(
                    `${reference.getSourceFile().getFilePath()}:${reference.getStartLineNumber()}: Unsupported payload argument \`${payloadArgument.getText()}\` in \`${parent.getText()}\`: spreading options first could change evaluation order. Left the import and all its uses unchanged; migrate manually.`,
                  )
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

          renameImport({ hadAlias, newName, spec })

          // Inner calls must be rewritten before replacing an enclosing call's text.
          for (const call of calls.sort((a, b) => b.getStart() - a.getStart())) {
            rewriteCall({ call })
          }
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
    'Renames Payload request and admin-context imports and migrates direct createLocalReq(options, payload) calls to createPayloadReq({ ...options, payload }); reports collisions and unsupported uses for manual migration.',
}

function renameImport({
  hadAlias,
  newName,
  spec,
}: {
  hadAlias: boolean
  newName: string
  spec: ImportSpecifier
}): void {
  if (hadAlias) {
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
  const comma = options!
    .getParentSyntaxListOrThrow()
    .getChildren()
    .find((node) => node.getKind() === SyntaxKind.CommaToken)!
  const text = call.getSourceFile().getFullText()
  const isEmpty = Node.isObjectLiteralExpression(options) && options.getProperties().length === 0
  const optionsText = isEmpty ? options.getText().slice(1, -1) : `...${options!.getText()}`
  const leading = text.slice(open.getEnd(), options!.getStart()) || (isEmpty ? '' : ' ')
  const trailing = text.slice(payload!.getEnd(), close.getStart()) || ' '
  const contents = [
    leading,
    optionsText,
    text.slice(options!.getEnd(), comma.getStart()),
    isEmpty ? '' : ',',
    text.slice(comma.getEnd(), payload!.getStart()),
    'payload: ',
    payload!.getText(),
    trailing,
  ].join('')

  call.replaceWithText(
    `${text.slice(call.getStart(), open.getEnd())}{${contents}}${text.slice(close.getStart(), call.getEnd())}`,
  )
}

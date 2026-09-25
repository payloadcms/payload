import type { ObjectLiteralElementLike, ObjectLiteralExpression, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const OLD_NAME = 'blockReferences'
const NEW_NAME = 'blocks'

type MigrationResult = {
  changed: boolean
  collisions: number
}

const migrateInSourceFile = (sourceFile: SourceFile): MigrationResult => {
  let changed = false
  let collisions = 0

  const objectLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)

  for (const objectLiteral of objectLiterals) {
    if (!isBlocksFieldObject(objectLiteral)) {
      continue
    }

    const blockReferences = objectLiteral.getProperty(OLD_NAME)
    if (!blockReferences || !Node.isPropertyAssignment(blockReferences)) {
      continue
    }

    const existingBlocks = objectLiteral.getProperty(NEW_NAME)
    if (existingBlocks) {
      if (isEmptyArrayProperty(existingBlocks)) {
        existingBlocks.remove()
      } else {
        collisions++
        continue
      }
    }

    blockReferences.getNameNode().replaceWithText(NEW_NAME)
    changed = true
  }

  return { changed, collisions }
}

export const migrateBlockReferencesToBlocks: Transform = {
  name: 'migrate-block-references-to-blocks',
  apply: ({ project }) => {
    const filesChanged: string[] = []
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const { changed, collisions } = migrateInSourceFile(sourceFile)
      if (changed) {
        filesChanged.push(sourceFile.getFilePath())
      }
      if (collisions > 0) {
        notes.push(
          `${sourceFile.getFilePath()}: left ${collisions} \`blockReferences\` ${
            collisions === 1 ? 'property' : 'properties'
          } untouched because a non-empty sibling \`blocks\` property already exists — resolve manually.`,
        )
      }
    }

    return notes.length > 0 ? { filesChanged, notes } : { filesChanged }
  },
  description:
    'Renames blocks field `blockReferences` configs to `blocks`. Removes a sibling `blocks: []` placeholder when present.',
}

function isEmptyArrayProperty(property: ObjectLiteralElementLike): boolean {
  if (!Node.isPropertyAssignment(property)) {
    return false
  }

  const initializer = property.getInitializer()
  return (
    !!initializer &&
    Node.isArrayLiteralExpression(initializer) &&
    initializer.getElements().length === 0
  )
}

function isBlocksFieldObject(objectLiteral: ObjectLiteralExpression): boolean {
  const typeProperty = objectLiteral.getProperty('type')
  if (!typeProperty || !Node.isPropertyAssignment(typeProperty)) {
    return false
  }

  const initializer = typeProperty.getInitializer()
  if (!initializer) {
    return false
  }

  const text = initializer.getText().replace(/\s+as\s+const$/, '')
  return text === "'blocks'" || text === '"blocks"' || text === '`blocks`'
}

import type { SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const OLD_NAME = 'typescriptSchema'
const NEW_NAME = 'jsonSchema'

const renameInSourceFile = (sourceFile: SourceFile): { changed: boolean; collisions: number } => {
  let changed = false
  let collisions = 0

  // Snapshot the object literals up front so renaming a key mid-loop doesn't
  // disturb iteration. Each rename only swaps the property-name token, so the
  // other object literals stay valid.
  const objectLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)

  for (const obj of objectLiterals) {
    const property = obj.getProperty(OLD_NAME)
    if (!property || !Node.isPropertyAssignment(property)) {
      continue
    }
    // Never overwrite an existing `jsonSchema` — leave the deprecated key in
    // place and surface it as a note for manual review.
    if (obj.getProperty(NEW_NAME)) {
      collisions++
      continue
    }
    property.getNameNode().replaceWithText(NEW_NAME)
    changed = true
  }

  return { changed, collisions }
}

export const renameTypescriptSchemaToJsonSchema: Transform = {
  name: 'rename-typescript-schema-to-json-schema',
  apply: ({ project }) => {
    const filesChanged: string[] = []
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const { changed, collisions } = renameInSourceFile(sourceFile)
      if (changed) {
        filesChanged.push(sourceFile.getFilePath())
      }
      if (collisions > 0) {
        notes.push(
          `${sourceFile.getFilePath()}: left ${collisions} \`typescriptSchema\` ${
            collisions === 1 ? 'property' : 'properties'
          } untouched because a sibling \`jsonSchema\` already exists — resolve manually.`,
        )
      }
    }

    return notes.length > 0 ? { filesChanged, notes } : { filesChanged }
  },
  description:
    'Renames the `typescriptSchema` field-config property to `jsonSchema`. Skips objects that already define a `jsonSchema` sibling.',
}

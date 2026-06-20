import { SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const removeGroupByTrue: Transform = {
  name: 'remove-group-by-true',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const targets = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => {
          if (prop.getName() !== 'groupBy') {
            return false
          }
          const parentObject = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
          const adminProp = parentObject?.getParentIfKind(SyntaxKind.PropertyAssignment)
          return adminProp?.getName() === 'admin'
        })

      for (const prop of targets) {
        const kind = prop.getInitializer()?.getKind()

        if (kind !== SyntaxKind.TrueKeyword && kind !== SyntaxKind.FalseKeyword) {
          notes.push(
            `${sourceFile.getFilePath()}: 'admin.groupBy' value is not a boolean literal — remove it manually; groupBy is now an always-available per-user UI preference.`,
          )
          continue
        }

        prop.remove()
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Remove admin.groupBy from collection configs. groupBy is now an always-available per-user UI preference, off by default.',
}

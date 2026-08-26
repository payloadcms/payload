import type { ObjectLiteralExpression } from 'ts-morph'

import { Node } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Removes `publishSpecificLocale` from `payload.update()` and
 * `payload.updateGlobal()` call-site options objects.
 *
 * If the object already has a `locale` property, `publishSpecificLocale` is
 * simply removed.  If it does not, the property is renamed to `locale` so the
 * same locale value is preserved.
 */
export const removePublishSpecificLocale: Transform = {
  name: 'remove-publish-specific-locale',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        if (!Node.isCallExpression(node)) {
          return
        }

        const expr = node.getExpression()
        if (!Node.isPropertyAccessExpression(expr)) {
          return
        }

        const methodName = expr.getName()
        if (methodName !== 'update' && methodName !== 'updateGlobal') {
          return
        }

        const args = node.getArguments()
        if (args.length === 0) {
          return
        }

        // The options object is always the first argument
        const optionsArg = args[0]
        if (!Node.isObjectLiteralExpression(optionsArg)) {
          return
        }

        const options = optionsArg
        const publishSpecificLocaleProp = options.getProperty('publishSpecificLocale')
        if (!publishSpecificLocaleProp) {
          return
        }

        const localeProp = options.getProperty('locale')

        if (localeProp) {
          // Already has `locale` — just drop publishSpecificLocale
          publishSpecificLocaleProp.remove()
        } else {
          // Rename publishSpecificLocale → locale to keep the value
          if (
            Node.isPropertyAssignment(publishSpecificLocaleProp) ||
            Node.isShorthandPropertyAssignment(publishSpecificLocaleProp)
          ) {
            if (Node.isPropertyAssignment(publishSpecificLocaleProp)) {
              const valueText = publishSpecificLocaleProp.getInitializer()?.getText() ?? 'undefined'
              publishSpecificLocaleProp.replaceWithText(`locale: ${valueText}`)
            } else {
              // shorthand: publishSpecificLocale → locale: publishSpecificLocale
              const name = publishSpecificLocaleProp.getName()
              publishSpecificLocaleProp.replaceWithText(`locale: ${name}`)
            }
          } else {
            // spread or method — just remove, we can't safely rename
            publishSpecificLocaleProp.remove()
          }
        }

        mutated = true
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Remove `publishSpecificLocale` from payload.update() and payload.updateGlobal() call sites. When `locale` is already present the property is simply removed; otherwise it is renamed to `locale` to preserve the value.',
}

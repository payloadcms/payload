import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const migrateMultiTenantTenantSelectorLabel: Transform = {
  name: 'migrate-multi-tenant-tenant-selector-label',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const targets = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => !prop.wasForgotten() && prop.getName() === 'tenantSelectorLabel')

      for (const prop of targets) {
        const filePath = sourceFile.getFilePath()
        const parentObject = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
        if (!parentObject) {
          continue
        }

        const initializer = prop.getInitializer()

        if (!initializer || !Node.isObjectLiteralExpression(initializer)) {
          prop.remove()
          notes.push(
            `${filePath}: 'tenantSelectorLabel' was a non-object value — add the label manually under 'i18n.translations.<locale>[\'nav-tenantSelector-label\']'.`,
          )
          filesChanged.add(filePath)
          continue
        }

        // If i18n already exists, merging automatically is unsafe
        if (parentObject.getProperty('i18n')) {
          prop.remove()
          notes.push(
            `${filePath}: 'tenantSelectorLabel' removed but 'i18n' already exists — merge each locale value manually into 'i18n.translations.<locale>[\'nav-tenantSelector-label\']'.`,
          )
          filesChanged.add(filePath)
          continue
        }

        // Build i18n.translations from { [locale]: string } object
        const localeEntries: string[] = []
        let hasUnsupported = false

        for (const localeProp of initializer.getProperties()) {
          if (!Node.isPropertyAssignment(localeProp)) {
            hasUnsupported = true
            break
          }
          const localeValue = localeProp.getInitializer()
          if (!localeValue) {
            hasUnsupported = true
            break
          }
          localeEntries.push(
            `${localeProp.getName()}: { 'nav-tenantSelector-label': ${localeValue.getText()} }`,
          )
        }

        if (hasUnsupported) {
          prop.remove()
          notes.push(
            `${filePath}: 'tenantSelectorLabel' contained unsupported syntax — migrate manually to 'i18n.translations.<locale>[\'nav-tenantSelector-label\']'.`,
          )
          filesChanged.add(filePath)
          continue
        }

        prop.replaceWithText(`i18n: { translations: { ${localeEntries.join(', ')} } }`)
        filesChanged.add(filePath)
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    "Migrate 'tenantSelectorLabel' to 'i18n.translations[locale][\"nav-tenantSelector-label\"]' in @payloadcms/plugin-multi-tenant config. Object values with locale keys are auto-migrated; string values are removed with a note for manual migration.",
}

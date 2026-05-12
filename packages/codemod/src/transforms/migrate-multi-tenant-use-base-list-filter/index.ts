import { SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const migrateMultiTenantUseBaseListFilter: Transform = {
  name: 'migrate-multi-tenant-use-base-list-filter',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      for (const property of sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment)) {
        if (property.wasForgotten()) {
          continue
        }
        if (property.getName() !== 'useBaseListFilter') {
          continue
        }

        // Verify the property is inside a per-collection config object nested under `collections`
        // Shape: collections: { [slug]: { useBaseListFilter: ... } }
        const collectionConfigObject = property.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
        if (!collectionConfigObject) {
          continue
        }

        const slugProperty = collectionConfigObject.getParentIfKind(SyntaxKind.PropertyAssignment)
        if (!slugProperty) {
          continue
        }

        const collectionsValueObject = slugProperty.getParentIfKind(
          SyntaxKind.ObjectLiteralExpression,
        )
        if (!collectionsValueObject) {
          continue
        }

        const collectionsProperty = collectionsValueObject.getParentIfKind(
          SyntaxKind.PropertyAssignment,
        )
        if (!collectionsProperty || collectionsProperty.getName() !== 'collections') {
          continue
        }

        property.getNameNode().replaceWithText('useBaseFilter')
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: Array.from(filesChanged) }
  },
  description:
    "Rename 'useBaseListFilter' to 'useBaseFilter' in @payloadcms/plugin-multi-tenant collection config.",
}

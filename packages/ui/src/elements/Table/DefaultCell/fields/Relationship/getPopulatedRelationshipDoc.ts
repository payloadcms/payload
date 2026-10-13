import type {
  ClientCollectionConfig,
  JoinFieldClient,
  RelationshipFieldClient,
  TypeWithID,
  UploadFieldClient,
} from 'payload'

export function getPopulatedRelationshipDoc({
  collectionConfig,
  doc,
  field,
}: {
  collectionConfig: ClientCollectionConfig
  doc?: TypeWithID
  field: JoinFieldClient | RelationshipFieldClient | UploadFieldClient
}): TypeWithID | undefined {
  const titleField = collectionConfig.admin.useAsTitle || 'id'

  if (doc?.[titleField] === undefined) {
    return undefined
  }

  if (field.type === 'upload') {
    const previewAllowed = field.displayPreview ?? collectionConfig.upload?.displayPreview ?? true

    if (
      previewAllowed &&
      (doc.mimeType === undefined || (doc.url === undefined && doc.thumbnailURL === undefined))
    ) {
      return undefined
    }
  }

  return doc
}

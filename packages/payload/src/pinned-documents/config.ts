import type { CollectionConfig } from '../collections/config/types.js'
import type { Access, AccessResult, Config } from '../config/types.js'

export const pinnedDocumentsCollectionSlug = 'payload-pinned-documents'

export const getPinnedDocumentsCollection = ({ config }: { config: Config }): CollectionConfig => {
  const authCollections = config.collections!.filter(({ auth }) => auth).map(({ slug }) => slug)
  const documentCollections = config.collections!.map(({ slug }) => slug)
  const defaultCollection: CollectionConfig = {
    slug: pinnedDocumentsCollectionSlug,
    access: {
      create: ({ req }) => Boolean(req.user),
      delete: ownerAccess,
      read: ownerAccess,
      update: ownerAccess,
    },
    admin: { hidden: true },
    authorship: false,
    fields: [
      {
        name: 'key',
        type: 'text',
        admin: { hidden: true },
        required: true,
        unique: true,
      },
      {
        name: 'document',
        type: 'relationship',
        index: true,
        maxDepth: 0,
        relationTo: documentCollections,
        required: true,
      },
      {
        name: 'user',
        type: 'relationship',
        index: true,
        maxDepth: 0,
        relationTo: authCollections,
        required: true,
      },
    ],
    hooks: {
      beforeValidate: [
        async ({ data, operation, originalDoc, req }) => {
          if (req.user && data?.document) {
            await req.payload.findByID({
              id: data.document.value,
              collection: data.document.relationTo,
              depth: 0,
              draft: true,
              overrideAccess: false,
              req,
              user: req.user,
            })
          }

          if (data) {
            const owner =
              operation === 'update'
                ? originalDoc?.user
                : req.user
                  ? { relationTo: req.user.collection, value: req.user.id }
                  : data.user
            const document = data.document ?? originalDoc?.document

            data.user = owner
            data.key = JSON.stringify([
              owner?.relationTo,
              String(owner?.value),
              document?.relationTo,
              String(document?.value),
            ])
          }

          return data
        },
      ],
    },
    lockDocuments: false,
    versions: false,
  }

  return {
    ...(config.pinnedDocuments?.collectionOverrides?.({ defaultCollection }) ?? defaultCollection),
    slug: pinnedDocumentsCollectionSlug,
  }
}

const ownerAccess: Access = ({ req: { user } }): AccessResult => {
  if (!user) {
    return false
  }

  return {
    and: [
      { 'user.relationTo': { equals: user.collection } },
      { 'user.value': { equals: user.id } },
    ],
  }
}

import type { PayloadRequest, TypedUser } from 'payload'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  req: PayloadRequest
  updateLastEdited?: boolean
}

type Result = {
  isLocked: boolean
  lastEditedAt: string
  user: TypedUser
}

const lockDurationDefault = 300 // Default 5 minutes in seconds

export const handleFormStateLocking = async ({
  id,
  collectionSlug,
  globalSlug,
  req,
  updateLastEdited,
}: Args): Promise<Result> => {
  let result: Result

  if (id || globalSlug) {
    let lockedDocumentQuery

    if (collectionSlug) {
      lockedDocumentQuery = {
        and: [
          { 'document.relationTo': { equals: collectionSlug } },
          { 'document.value': { equals: id } },
        ],
      }
    } else if (globalSlug) {
      lockedDocumentQuery = {
        and: [{ globalSlug: { equals: globalSlug } }],
      }
    }

    const lockDocumentsProp = collectionSlug
      ? req.payload.collections?.[collectionSlug]?.config.lockDocuments
      : req.payload.config.globals.find((g) => g.slug === globalSlug)?.lockDocuments

    const lockDuration =
      typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault
    const lockDurationInMilliseconds = lockDuration * 1000
    const now = new Date().getTime()

    if (lockedDocumentQuery) {
      // Query where the lock is newer than the current time minus the lock duration
      lockedDocumentQuery.and.push({
        updatedAt: {
          greater_than: new Date(now - lockDurationInMilliseconds).toISOString(),
        },
      })

      const lockedDocument = await req.payload.find({
        collection: 'payload-locked-documents',
        depth: 1,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        user: req.user,
        where: lockedDocumentQuery,
      })

      if (lockedDocument.docs && lockedDocument.docs.length > 0) {
        result = {
          isLocked: true,
          lastEditedAt: lockedDocument.docs[0]?.updatedAt,
          user: lockedDocument.docs[0]?.user?.value,
        }

        const lockOwnerID =
          typeof lockedDocument.docs[0]?.user?.value === 'object'
            ? lockedDocument.docs[0]?.user?.value?.id
            : lockedDocument.docs[0]?.user?.value
        // Should only update doc if the incoming / current user is also the owner of the locked doc
        if (updateLastEdited && req.user && lockOwnerID === req.user.id) {
          await req.payload.db.updateOne({
            id: lockedDocument.docs[0].id,
            collection: 'payload-locked-documents',
            data: {},
            returning: false,
          })
        }
      } else {
        // If NO ACTIVE lock document exists, first delete any expired locks and then create a fresh lock
        // Where updatedAt is older than the duration that is specified in the config
        let deleteExpiredLocksQuery

        if (collectionSlug) {
          deleteExpiredLocksQuery = {
            and: [
              { 'document.relationTo': { equals: collectionSlug } },
              {
                updatedAt: {
                  less_than: new Date(now - lockDurationInMilliseconds).toISOString(),
                },
              },
            ],
          }
        } else if (globalSlug) {
          deleteExpiredLocksQuery = {
            and: [
              { globalSlug: { equals: globalSlug } },
              {
                updatedAt: {
                  less_than: new Date(now - lockDurationInMilliseconds).toISOString(),
                },
              },
            ],
          }
        }

        await req.payload.db.deleteMany({
          collection: 'payload-locked-documents',
          where: deleteExpiredLocksQuery,
        })

        await req.payload.db.create({
          collection: 'payload-locked-documents',
          data: {
            document: collectionSlug
              ? {
                  relationTo: collectionSlug,
                  value: id,
                }
              : undefined,
            globalSlug: globalSlug ? globalSlug : undefined,
            user: {
              relationTo: req.user.collection,
              value: req.user.id,
            },
          },
          returning: false,
        })

        result = {
          isLocked: true,
          lastEditedAt: new Date().toISOString(),
          user: req.user,
        }
      }
    }
  }

  return result
}

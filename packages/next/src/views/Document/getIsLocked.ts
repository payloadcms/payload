import type {
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypedUser,
  Where,
} from 'payload'

import { sanitizeID } from '@payloadcms/ui/shared'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  isEditing: boolean
  req: PayloadRequest
}

type Result = Promise<{
  currentEditor?: TypedUser
  isLocked: boolean
  lastUpdateTime?: number
}>

export const getIsLocked = async ({
  id,
  collectionConfig,
  globalConfig,
  isEditing,
  req,
}: Args): Result => {
  const entityConfig = collectionConfig || globalConfig

  const entityHasLockingEnabled =
    entityConfig?.lockDocuments !== undefined ? entityConfig?.lockDocuments : true

  if (!entityHasLockingEnabled || !isEditing) {
    return {
      isLocked: false,
    }
  }

  const where: Where = {}

  const lockDurationDefault = 300 // Default 5 minutes in seconds
  const lockDuration =
    typeof entityConfig.lockDocuments === 'object'
      ? entityConfig.lockDocuments.duration
      : lockDurationDefault
  const lockDurationInMilliseconds = lockDuration * 1000

  const now = new Date().getTime()

  if (globalConfig) {
    where.and = [
      {
        globalSlug: {
          equals: globalConfig.slug,
        },
      },
      {
        updatedAt: {
          greater_than: new Date(now - lockDurationInMilliseconds),
        },
      },
    ]
  } else {
    where.and = [
      {
        'document.value': {
          equals: sanitizeID(id),
        },
      },
      {
        'document.relationTo': {
          equals: collectionConfig.slug,
        },
      },
      {
        updatedAt: {
          greater_than: new Date(now - lockDurationInMilliseconds),
        },
      },
    ]
  }

  const { docs } = await req.payload.find({
    collection: 'payload-locked-documents',
    depth: 1,
    overrideAccess: false,
    req,
    where,
  })

  if (docs.length > 0) {
    const newEditor = docs[0].user?.value
    const lastUpdateTime = new Date(docs[0].updatedAt).getTime()

    if (newEditor?.id !== req.user.id) {
      return {
        currentEditor: newEditor,
        isLocked: true,
        lastUpdateTime,
      }
    }
  }

  return {
    isLocked: false,
  }
}

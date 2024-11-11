import type {
  Payload,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypedUser,
  Where,
} from 'payload'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  isEditing: boolean
  payload: Payload
  user: TypedUser
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
  payload,
  user,
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

  if (globalConfig) {
    where.globalSlug = {
      equals: globalConfig.slug,
    }
  } else {
    where.and = [
      {
        'document.value': {
          equals: id,
        },
      },
      {
        'document.relationTo': {
          equals: collectionConfig.slug,
        },
      },
    ]
  }

  const { docs } = await payload.find({
    collection: 'payload-locked-documents',
    depth: 1,
    where,
  })

  if (docs.length > 0) {
    const newEditor = docs[0].user?.value
    const lastUpdateTime = new Date(docs[0].updatedAt).getTime()

    if (newEditor?.id !== user.id) {
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

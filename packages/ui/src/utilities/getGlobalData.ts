import type { ClientUser, PayloadRequest, TypedUser } from 'payload'

const globalLockDurationDefault = 300

export async function getGlobalData(req: PayloadRequest) {
  const {
    payload: { config },
    payload,
  } = req
  // Query locked global documents only if there are globals in the config
  // This type is repeated from DashboardViewServerPropsOnly['globalData'].
  // I thought about moving it to a payload to share it, but we're already
  // exporting all the views props from the next package.
  let globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }> = []

  if (config.globals.length > 0) {
    const lockedDocuments = await payload.find({
      collection: 'payload-locked-documents',
      depth: 1,
      overrideAccess: false,
      pagination: false,
      req,
      select: {
        globalSlug: true,
        updatedAt: true,
        user: true,
      },
      where: {
        globalSlug: {
          exists: true,
        },
      },
    })

    // Map over globals to include `lockDuration` and lock data for each global slug
    globalData = config.globals.map((global) => {
      const lockDuration =
        typeof global.lockDocuments === 'object'
          ? global.lockDocuments.duration
          : globalLockDurationDefault

      const lockedDoc = lockedDocuments.docs.find((doc) => doc.globalSlug === global.slug)

      return {
        slug: global.slug,
        data: {
          _isLocked: !!lockedDoc,
          _lastEditedAt: (lockedDoc?.updatedAt as string) ?? null,
          _userEditing: (lockedDoc?.user as { value?: TypedUser })?.value ?? null!,
        },
        lockDuration,
      }
    })
  }

  return globalData
}

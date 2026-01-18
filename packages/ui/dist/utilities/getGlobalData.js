const globalLockDurationDefault = 300;
export async function getGlobalData(req) {
  const {
    payload: {
      config
    },
    payload
  } = req;
  // Query locked global documents only if there are globals in the config
  // This type is repeated from DashboardViewServerPropsOnly['globalData'].
  // I thought about moving it to a payload to share it, but we're already
  // exporting all the views props from the next package.
  let globalData = [];
  if (config.globals.length > 0) {
    if (payload.collections?.['payload-locked-documents']) {
      const lockedDocuments = await payload.find({
        collection: 'payload-locked-documents',
        depth: 1,
        overrideAccess: false,
        pagination: false,
        req,
        select: {
          globalSlug: true,
          updatedAt: true,
          user: true
        },
        where: {
          globalSlug: {
            exists: true
          }
        }
      });
      // Map over globals to include `lockDuration` and lock data for each global slug
      globalData = config.globals.map(global => {
        const lockDuration = typeof global.lockDocuments === 'object' ? global.lockDocuments.duration : globalLockDurationDefault;
        const lockedDoc = lockedDocuments.docs.find(doc => doc.globalSlug === global.slug);
        return {
          slug: global.slug,
          data: {
            _isLocked: !!lockedDoc,
            _lastEditedAt: lockedDoc?.updatedAt ?? null,
            _userEditing: lockedDoc?.user?.value ?? null
          },
          lockDuration
        };
      });
    } else {
      // If locked-documents collection doesn't exist, return globals without lock data
      globalData = config.globals.map(global => {
        const lockDuration = typeof global.lockDocuments === 'object' ? global.lockDocuments.duration : globalLockDurationDefault;
        return {
          slug: global.slug,
          data: {
            _isLocked: false,
            _lastEditedAt: null,
            _userEditing: null
          },
          lockDuration
        };
      });
    }
  }
  return globalData;
}
//# sourceMappingURL=getGlobalData.js.map
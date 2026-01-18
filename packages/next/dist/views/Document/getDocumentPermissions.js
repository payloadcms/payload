import { hasSavePermission as getHasSavePermission, isEditing as getIsEditing } from '@payloadcms/ui/shared';
import { docAccessOperation, docAccessOperationGlobal, logError } from 'payload';
import { hasDraftsEnabled } from 'payload/shared';
export const getDocumentPermissions = async args => {
  const {
    id,
    collectionConfig,
    data = {},
    globalConfig,
    req
  } = args;
  let docPermissions;
  let hasPublishPermission = false;
  if (collectionConfig) {
    try {
      docPermissions = await docAccessOperation({
        id,
        collection: {
          config: collectionConfig
        },
        data: {
          ...data,
          _status: 'draft'
        },
        req
      });
      if (hasDraftsEnabled(collectionConfig)) {
        hasPublishPermission = (await docAccessOperation({
          id,
          collection: {
            config: collectionConfig
          },
          data: {
            ...data,
            _status: 'published'
          },
          req
        })).update;
      }
    } catch (err) {
      logError({
        err,
        payload: req.payload
      });
    }
  }
  if (globalConfig) {
    try {
      docPermissions = await docAccessOperationGlobal({
        data,
        globalConfig,
        req
      });
      if (hasDraftsEnabled(globalConfig)) {
        hasPublishPermission = (await docAccessOperationGlobal({
          data: {
            ...data,
            _status: 'published'
          },
          globalConfig,
          req
        })).update;
      }
    } catch (err) {
      logError({
        err,
        payload: req.payload
      });
    }
  }
  const hasSavePermission = getHasSavePermission({
    collectionSlug: collectionConfig?.slug,
    docPermissions,
    globalSlug: globalConfig?.slug,
    isEditing: getIsEditing({
      id,
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug
    })
  });
  return {
    docPermissions,
    hasPublishPermission,
    hasSavePermission
  };
};
//# sourceMappingURL=getDocumentPermissions.js.map
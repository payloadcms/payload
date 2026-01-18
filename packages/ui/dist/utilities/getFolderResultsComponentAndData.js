import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { APIError, formatErrors, getFolderData } from 'payload';
import { buildFolderWhereConstraints, combineWhereConstraints } from 'payload/shared';
import { FolderFileTable, ItemCardGrid } from '../exports/client/index.js';
export const getFolderResultsComponentAndDataHandler = async args => {
  const {
    req
  } = args;
  try {
    const res = await getFolderResultsComponentAndData(args);
    return res;
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `There was an error getting the folder results component and data`
    });
    return formatErrors(err);
  }
};
/**
 * This function is responsible for fetching folder data, building the results component
 * and returns the data and component together.
 */
export const getFolderResultsComponentAndData = async ({
  browseByFolder = false,
  collectionsToDisplay: activeCollectionSlugs,
  displayAs,
  folderAssignedCollections,
  folderID = undefined,
  req,
  sort
}) => {
  const {
    payload
  } = req;
  if (!payload.config.folders) {
    throw new APIError('Folders are not enabled in the configuration.');
  }
  const emptyQuery = {
    id: {
      exists: false
    }
  };
  let collectionSlug = undefined;
  let documentWhere = Array.isArray(activeCollectionSlugs) && !activeCollectionSlugs.length ? emptyQuery : undefined;
  let folderWhere = Array.isArray(activeCollectionSlugs) && !activeCollectionSlugs.length ? emptyQuery : undefined;
  // todo(perf): - collect promises and resolve them in parallel
  for (const activeCollectionSlug of activeCollectionSlugs) {
    if (activeCollectionSlug === payload.config.folders.slug) {
      const folderCollectionConstraints = await buildFolderWhereConstraints({
        collectionConfig: payload.collections[activeCollectionSlug].config,
        folderID,
        localeCode: req?.locale,
        req,
        search: typeof req?.query?.search === 'string' ? req.query.search : undefined,
        sort
      });
      if (folderCollectionConstraints) {
        folderWhere = folderCollectionConstraints;
      }
      folderWhere = combineWhereConstraints([folderWhere, Array.isArray(folderAssignedCollections) && folderAssignedCollections.length && payload.config.folders.collectionSpecific ? {
        or: [{
          folderType: {
            in: folderAssignedCollections
          }
        },
        // if the folderType is not set, it means it accepts all collections and should appear in the results
        {
          folderType: {
            exists: false
          }
        }]
      } : undefined]);
    } else if (browseByFolder && folderID || !browseByFolder) {
      if (!browseByFolder) {
        collectionSlug = activeCollectionSlug;
      }
      if (!documentWhere) {
        documentWhere = {
          or: []
        };
      }
      const collectionConstraints = await buildFolderWhereConstraints({
        collectionConfig: payload.collections[activeCollectionSlug].config,
        folderID,
        localeCode: req?.locale,
        req,
        search: typeof req?.query?.search === 'string' ? req.query.search : undefined,
        sort
      });
      if (collectionConstraints) {
        documentWhere.or.push(collectionConstraints);
      }
    }
  }
  const folderData = await getFolderData({
    collectionSlug,
    documentWhere,
    folderID,
    folderWhere,
    req,
    sort
  });
  let FolderResultsComponent = null;
  if (displayAs === 'grid') {
    FolderResultsComponent = /*#__PURE__*/_jsxs("div", {
      children: [folderData.subfolders.length ? /*#__PURE__*/_jsx(_Fragment, {
        children: /*#__PURE__*/_jsx(ItemCardGrid, {
          items: folderData.subfolders,
          title: 'Folders',
          type: "folder"
        })
      }) : null, folderData.documents.length ? /*#__PURE__*/_jsx(_Fragment, {
        children: /*#__PURE__*/_jsx(ItemCardGrid, {
          items: folderData.documents,
          subfolderCount: folderData.subfolders.length,
          title: 'Documents',
          type: "file"
        })
      }) : null]
    });
  } else {
    FolderResultsComponent = /*#__PURE__*/_jsx(FolderFileTable, {
      showRelationCell: browseByFolder
    });
  }
  return {
    breadcrumbs: folderData.breadcrumbs,
    documents: folderData.documents,
    folderAssignedCollections: folderData.folderAssignedCollections,
    FolderResultsComponent,
    subfolders: folderData.subfolders
  };
};
//# sourceMappingURL=getFolderResultsComponentAndData.js.map
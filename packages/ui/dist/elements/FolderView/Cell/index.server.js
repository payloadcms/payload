import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { FolderTableCellClient } from './index.client.js';
export const FolderTableCell = props => {
  const titleToRender = (props.collectionConfig.upload ? props.rowData?.filename : props.rowData?.title) || props.rowData.id;
  if (!props.payload.config.folders) {
    return null;
  }
  return /*#__PURE__*/_jsx(FolderTableCellClient, {
    collectionSlug: props.collectionSlug,
    data: props.rowData,
    docTitle: titleToRender,
    folderCollectionSlug: props.payload.config.folders.slug,
    folderFieldName: props.payload.config.folders.fieldName,
    viewType: props.viewType
  });
};
//# sourceMappingURL=index.server.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Banner } from '@payloadcms/ui/elements/Banner';
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
export const renderListViewSlots = ({
  clientProps,
  collectionConfig,
  description,
  notFoundDocId,
  payload,
  serverProps
}) => {
  const result = {};
  if (collectionConfig.admin.components?.afterList) {
    result.AfterList = RenderServerComponent({
      clientProps: clientProps,
      Component: collectionConfig.admin.components.afterList,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  const listMenuItems = collectionConfig.admin.components?.listMenuItems;
  if (Array.isArray(listMenuItems)) {
    result.listMenuItems = [RenderServerComponent({
      clientProps,
      Component: listMenuItems,
      importMap: payload.importMap,
      serverProps
    })];
  }
  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterListTable = RenderServerComponent({
      clientProps: clientProps,
      Component: collectionConfig.admin.components.afterListTable,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeList = RenderServerComponent({
      clientProps: clientProps,
      Component: collectionConfig.admin.components.beforeList,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  // Handle beforeListTable with optional banner
  const existingBeforeListTable = collectionConfig.admin.components?.beforeListTable ? RenderServerComponent({
    clientProps: clientProps,
    Component: collectionConfig.admin.components.beforeListTable,
    importMap: payload.importMap,
    serverProps: serverProps
  }) : null;
  // Create banner for document not found
  const notFoundBanner = notFoundDocId ? /*#__PURE__*/_jsx(Banner, {
    type: "error",
    children: serverProps.i18n.t('error:documentNotFound', {
      id: notFoundDocId
    })
  }) : null;
  // Combine banner and existing component
  if (notFoundBanner || existingBeforeListTable) {
    result.BeforeListTable = /*#__PURE__*/_jsxs(React.Fragment, {
      children: [notFoundBanner, existingBeforeListTable]
    });
  }
  if (collectionConfig.admin.components?.Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        collectionSlug: collectionConfig.slug,
        description
      },
      Component: collectionConfig.admin.components.Description,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  return result;
};
//# sourceMappingURL=renderListViewSlots.js.map
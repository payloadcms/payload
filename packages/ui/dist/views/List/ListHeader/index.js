import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { CloseModalButton } from '../../../elements/CloseModalButton/index.js';
import { DefaultListViewTabs } from '../../../elements/DefaultListViewTabs/index.js';
import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js';
import { DrawerRelationshipSelect } from '../../../elements/ListHeader/DrawerRelationshipSelect/index.js';
import { ListDrawerCreateNewDocButton } from '../../../elements/ListHeader/DrawerTitleActions/index.js';
import { ListHeader } from '../../../elements/ListHeader/index.js';
import { ListBulkUploadButton, ListCreateNewButton, ListEmptyTrashButton } from '../../../elements/ListHeader/TitleActions/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useListQuery } from '../../../providers/ListQuery/index.js';
import { ListSelection } from '../ListSelection/index.js';
import './index.scss';
const drawerBaseClass = 'list-drawer';
export const CollectionListHeader = ({
  className,
  collectionConfig,
  Description,
  disableBulkDelete,
  disableBulkEdit,
  hasCreatePermission,
  hasDeletePermission,
  i18n,
  isBulkUploadEnabled,
  isTrashEnabled,
  newDocumentURL,
  onBulkUploadSuccess,
  openBulkUpload,
  smallBreak,
  viewType
}) => {
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    drawerSlug,
    isInDrawer,
    selectedOption
  } = useListDrawerContext();
  const isTrashRoute = viewType === 'trash';
  const {
    isGroupingBy
  } = useListQuery();
  if (isInDrawer) {
    return /*#__PURE__*/_jsx(ListHeader, {
      Actions: [/*#__PURE__*/_jsx(CloseModalButton, {
        className: `${drawerBaseClass}__header-close`,
        slug: drawerSlug
      }, "close-button")],
      AfterListHeaderContent: /*#__PURE__*/_jsxs(_Fragment, {
        children: [Description, /*#__PURE__*/_jsx(DrawerRelationshipSelect, {})]
      }),
      className: `${drawerBaseClass}__header`,
      title: getTranslation(getEntityConfig({
        collectionSlug: selectedOption.value
      })?.labels?.plural, i18n),
      TitleActions: [/*#__PURE__*/_jsx(ListDrawerCreateNewDocButton, {
        hasCreatePermission: hasCreatePermission
      }, "list-drawer-create-new-doc")].filter(Boolean)
    });
  }
  return /*#__PURE__*/_jsx(ListHeader, {
    Actions: [!smallBreak && !isGroupingBy && /*#__PURE__*/_jsx(ListSelection, {
      collectionConfig: collectionConfig,
      disableBulkDelete: disableBulkDelete,
      disableBulkEdit: disableBulkEdit,
      label: getTranslation(collectionConfig?.labels?.plural, i18n),
      showSelectAllAcrossPages: !isGroupingBy,
      viewType: viewType
    }, "list-selection"), /*#__PURE__*/_jsx(DefaultListViewTabs, {
      collectionConfig: collectionConfig,
      config: config,
      viewType: viewType
    }, "default-list-actions")].filter(Boolean),
    AfterListHeaderContent: Description,
    className: className,
    title: getTranslation(collectionConfig?.labels?.plural, i18n),
    TitleActions: [hasCreatePermission && !isTrashRoute && /*#__PURE__*/_jsx(ListCreateNewButton, {
      collectionConfig: collectionConfig,
      hasCreatePermission: hasCreatePermission,
      newDocumentURL: newDocumentURL
    }, "list-header-create-new-doc"), hasCreatePermission && isBulkUploadEnabled && !isTrashRoute && /*#__PURE__*/_jsx(ListBulkUploadButton, {
      collectionSlug: collectionConfig.slug,
      hasCreatePermission: hasCreatePermission,
      isBulkUploadEnabled: isBulkUploadEnabled,
      onBulkUploadSuccess: onBulkUploadSuccess,
      openBulkUpload: openBulkUpload
    }, "list-header-bulk-upload"), hasDeletePermission && isTrashEnabled && viewType === 'trash' && /*#__PURE__*/_jsx(ListEmptyTrashButton, {
      collectionConfig: collectionConfig,
      hasDeletePermission: hasDeletePermission
    }, "list-header-empty-trash")].filter(Boolean)
  });
};
//# sourceMappingURL=index.js.map
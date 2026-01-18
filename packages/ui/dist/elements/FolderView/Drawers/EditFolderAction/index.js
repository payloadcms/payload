import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRouteCache } from '../../../../providers/RouteCache/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js';
import { ListSelectionButton } from '../../../ListSelection/index.js';
export const EditFolderAction = ({
  id,
  folderCollectionSlug
}) => {
  const {
    clearRouteCache
  } = useRouteCache();
  const {
    t
  } = useTranslation();
  const [FolderDocumentDrawer,, {
    closeDrawer,
    openDrawer
  }] = useDocumentDrawer({
    id,
    collectionSlug: folderCollectionSlug
  });
  if (!id) {
    return null;
  }
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(ListSelectionButton, {
      onClick: openDrawer,
      type: "button",
      children: t('general:edit')
    }), /*#__PURE__*/_jsx(FolderDocumentDrawer, {
      onSave: () => {
        closeDrawer();
        clearRouteCache();
      }
    })]
  });
};
//# sourceMappingURL=index.js.map
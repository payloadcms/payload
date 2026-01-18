'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { extractID } from 'payload/shared';
import React, { Fragment } from 'react';
import { toast } from 'sonner';
import { DeleteMany_v4 } from '../../../elements/DeleteMany/index.js';
import { EditMany_v4 } from '../../../elements/EditMany/index.js';
import { EditFolderAction } from '../../../elements/FolderView/Drawers/EditFolderAction/index.js';
import { MoveItemsToFolderDrawer } from '../../../elements/FolderView/Drawers/MoveToFolder/index.js';
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js';
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js';
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useFolder } from '../../../providers/Folders/index.js';
import { useRouteCache } from '../../../providers/RouteCache/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
const moveToFolderDrawerSlug = 'move-to-folder--list';
export const ListSelection = t0 => {
  const $ = _c(17);
  const {
    disableBulkDelete,
    disableBulkEdit,
    folderAssignedCollections
  } = t0;
  const {
    clearSelections,
    currentFolder,
    folderCollectionSlug,
    folderFieldName,
    folderID,
    getSelectedItems,
    moveToFolder
  } = useFolder();
  const {
    clearRouteCache
  } = useRouteCache();
  const {
    config
  } = useConfig();
  const {
    t
  } = useTranslation();
  const {
    closeModal,
    openModal
  } = useModal();
  let t1;
  let t2;
  if ($[0] !== clearRouteCache || $[1] !== clearSelections || $[2] !== closeModal || $[3] !== config || $[4] !== currentFolder?.value?._folderOrDocumentTitle || $[5] !== disableBulkDelete || $[6] !== disableBulkEdit || $[7] !== folderAssignedCollections || $[8] !== folderCollectionSlug || $[9] !== folderFieldName || $[10] !== folderID || $[11] !== getSelectedItems || $[12] !== moveToFolder || $[13] !== openModal || $[14] !== t) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const items = getSelectedItems();
      const groupedSelections = items.reduce(_temp, {});
      const count = items.length;
      const singleNonFolderCollectionSelected = Object.keys(groupedSelections).length === 1 && Object.keys(groupedSelections)[0] !== folderCollectionSlug;
      const collectionConfig = singleNonFolderCollectionSelected ? config.collections.find(collection => collection.slug === Object.keys(groupedSelections)[0]) : null;
      if (count === 0) {
        t2 = null;
        break bb0;
      }
      const ids = singleNonFolderCollectionSelected ? groupedSelections[Object.keys(groupedSelections)[0]]?.ids || [] : [];
      t1 = _jsx(ListSelection_v4, {
        count,
        ListActions: [count > 0 && _jsx(ListSelectionButton, {
          onClick: () => clearSelections(),
          children: t("general:clearAll")
        }, "clear-all")].filter(Boolean),
        SelectionActions: [!disableBulkEdit && ids.length && _jsxs(Fragment, {
          children: [_jsx(EditMany_v4, {
            collection: collectionConfig,
            count,
            ids,
            selectAll: false
          }), _jsx(PublishMany_v4, {
            collection: collectionConfig,
            count,
            ids,
            selectAll: false
          }), _jsx(UnpublishMany_v4, {
            collection: collectionConfig,
            count,
            ids,
            selectAll: false
          })]
        }, "bulk-actions"), count === 1 && !singleNonFolderCollectionSelected && _jsx(EditFolderAction, {
          folderCollectionSlug,
          id: groupedSelections[folderCollectionSlug].ids[0]
        }, "edit-folder-action"), count > 0 ? _jsxs(React.Fragment, {
          children: [_jsx(ListSelectionButton, {
            onClick: () => {
              openModal(moveToFolderDrawerSlug);
            },
            type: "button",
            children: t("general:move")
          }), _jsx(MoveItemsToFolderDrawer, {
            action: "moveItemsToFolder",
            drawerSlug: moveToFolderDrawerSlug,
            folderAssignedCollections,
            folderCollectionSlug,
            folderFieldName,
            fromFolderID: folderID,
            fromFolderName: currentFolder?.value?._folderOrDocumentTitle,
            itemsToMove: getSelectedItems(),
            onConfirm: async t3 => {
              const {
                id,
                name
              } = t3;
              await moveToFolder({
                itemsToMove: getSelectedItems(),
                toFolderID: id
              });
              if (id) {
                toast.success(t("folder:itemsMovedToFolder", {
                  folderName: `"${name}"`,
                  title: `${count} ${count > 1 ? t("general:items") : t("general:item")}`
                }));
              } else {
                toast.success(t("folder:itemsMovedToRoot", {
                  title: `${count} ${count > 1 ? t("general:items") : t("general:item")}`
                }));
              }
              clearRouteCache();
              closeModal(moveToFolderDrawerSlug);
            }
          })]
        }, moveToFolderDrawerSlug) : null, !disableBulkDelete && _jsx(DeleteMany_v4, {
          afterDelete: () => {
            clearRouteCache();
            clearSelections();
          },
          selections: groupedSelections
        }, "bulk-delete")].filter(Boolean)
      });
    }
    $[0] = clearRouteCache;
    $[1] = clearSelections;
    $[2] = closeModal;
    $[3] = config;
    $[4] = currentFolder?.value?._folderOrDocumentTitle;
    $[5] = disableBulkDelete;
    $[6] = disableBulkEdit;
    $[7] = folderAssignedCollections;
    $[8] = folderCollectionSlug;
    $[9] = folderFieldName;
    $[10] = folderID;
    $[11] = getSelectedItems;
    $[12] = moveToFolder;
    $[13] = openModal;
    $[14] = t;
    $[15] = t1;
    $[16] = t2;
  } else {
    t1 = $[15];
    t2 = $[16];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  return t1;
};
function _temp(acc, item) {
  if (item) {
    if (acc[item.relationTo]) {
      acc[item.relationTo].ids.push(extractID(item.value));
      acc[item.relationTo].totalCount = acc[item.relationTo].totalCount + 1;
    } else {
      acc[item.relationTo] = {
        ids: [extractID(item.value)],
        totalCount: 1
      };
    }
  }
  return acc;
}
//# sourceMappingURL=index.js.map
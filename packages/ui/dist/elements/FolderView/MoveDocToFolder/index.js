'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { formatAdminURL } from 'payload/shared';
import React, { useId } from 'react';
import { toast } from 'sonner';
import { useForm, useFormFields } from '../../../forms/Form/context.js';
import { FolderIcon } from '../../../icons/Folder/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
import { formatDrawerSlug, useDrawerDepth } from '../../Drawer/index.js';
import './index.scss';
import { MoveItemsToFolderDrawer } from '../Drawers/MoveToFolder/index.js';
const baseClass = 'move-doc-to-folder';
/**
 * This is the button shown on the edit document view. It uses the more generic `MoveDocToFolderButton` component.
 */
export function MoveDocToFolder(t0) {
  const $ = _c(29);
  const {
    buttonProps,
    className: t1,
    folderCollectionSlug,
    folderFieldName
  } = t0;
  const className = t1 === undefined ? "" : t1;
  const {
    t
  } = useTranslation();
  const dispatchField = useFormFields(_temp);
  let t2;
  if ($[0] !== folderFieldName) {
    t2 = t3 => {
      const [fields] = t3;
      return fields && fields?.[folderFieldName] || null;
    };
    $[0] = folderFieldName;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const currentParentFolder = useFormFields(t2);
  const fromFolderID = currentParentFolder?.value;
  const {
    id,
    collectionSlug,
    initialData,
    title
  } = useDocumentInfo();
  const {
    setModified
  } = useForm();
  let t3;
  if ($[2] !== t) {
    t3 = () => `${t("general:loading")}...`;
    $[2] = t;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const [fromFolderName, setFromFolderName] = React.useState(t3);
  const {
    config
  } = useConfig();
  const modalID = useId();
  let t4;
  let t5;
  if ($[4] !== config.routes.api || $[5] !== folderCollectionSlug || $[6] !== fromFolderID || $[7] !== t) {
    t4 = () => {
      const fetchFolderLabel = async function fetchFolderLabel() {
        if (fromFolderID && (typeof fromFolderID === "string" || typeof fromFolderID === "number")) {
          const response = await fetch(formatAdminURL({
            apiRoute: config.routes.api,
            path: `/${folderCollectionSlug}/${fromFolderID}`
          }));
          const folderData = await response.json();
          setFromFolderName(folderData?.name || t("folder:noFolder"));
        } else {
          setFromFolderName(t("folder:noFolder"));
        }
      };
      fetchFolderLabel();
    };
    t5 = [folderCollectionSlug, config.routes.api, fromFolderID, t];
    $[4] = config.routes.api;
    $[5] = folderCollectionSlug;
    $[6] = fromFolderID;
    $[7] = t;
    $[8] = t4;
    $[9] = t5;
  } else {
    t4 = $[8];
    t5 = $[9];
  }
  React.useEffect(t4, t5);
  const t6 = `move-to-folder-${modalID}`;
  let t7;
  if ($[10] !== currentParentFolder || $[11] !== dispatchField || $[12] !== folderFieldName || $[13] !== setModified) {
    t7 = t8 => {
      const {
        id: id_0
      } = t8;
      if (currentParentFolder.value !== id_0) {
        dispatchField({
          type: "UPDATE",
          path: folderFieldName,
          value: id_0
        });
        setModified(true);
      }
    };
    $[10] = currentParentFolder;
    $[11] = dispatchField;
    $[12] = folderFieldName;
    $[13] = setModified;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  const t8 = !currentParentFolder?.value;
  let t9;
  if ($[15] !== buttonProps || $[16] !== className || $[17] !== collectionSlug || $[18] !== folderCollectionSlug || $[19] !== folderFieldName || $[20] !== fromFolderID || $[21] !== fromFolderName || $[22] !== id || $[23] !== initialData || $[24] !== t6 || $[25] !== t7 || $[26] !== t8 || $[27] !== title) {
    t9 = _jsx(MoveDocToFolderButton, {
      buttonProps,
      className,
      collectionSlug,
      docData: initialData,
      docID: id,
      docTitle: title,
      folderCollectionSlug,
      folderFieldName,
      fromFolderID,
      fromFolderName,
      modalSlug: t6,
      onConfirm: t7,
      skipConfirmModal: t8
    });
    $[15] = buttonProps;
    $[16] = className;
    $[17] = collectionSlug;
    $[18] = folderCollectionSlug;
    $[19] = folderFieldName;
    $[20] = fromFolderID;
    $[21] = fromFolderName;
    $[22] = id;
    $[23] = initialData;
    $[24] = t6;
    $[25] = t7;
    $[26] = t8;
    $[27] = title;
    $[28] = t9;
  } else {
    t9 = $[28];
  }
  return t9;
}
/**
 * This is a more generic button that can be used in other contexts, such as table cells and the edit view.
 */
function _temp(t0) {
  const [, dispatch] = t0;
  return dispatch;
}
export const MoveDocToFolderButton = t0 => {
  const $ = _c(22);
  const {
    buttonProps,
    className,
    collectionSlug,
    docData,
    docID,
    docTitle,
    folderCollectionSlug,
    folderFieldName,
    fromFolderID,
    fromFolderName,
    modalSlug,
    onConfirm,
    skipConfirmModal
  } = t0;
  const {
    getEntityConfig
  } = useConfig();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    closeModal,
    openModal
  } = useModal();
  const drawerDepth = useDrawerDepth();
  let t1;
  if ($[0] !== buttonProps || $[1] !== className || $[2] !== closeModal || $[3] !== collectionSlug || $[4] !== docData || $[5] !== docID || $[6] !== docTitle || $[7] !== drawerDepth || $[8] !== folderCollectionSlug || $[9] !== folderFieldName || $[10] !== fromFolderID || $[11] !== fromFolderName || $[12] !== getEntityConfig || $[13] !== i18n || $[14] !== modalSlug || $[15] !== onConfirm || $[16] !== openModal || $[17] !== skipConfirmModal || $[18] !== t) {
    const drawerSlug = formatDrawerSlug({
      slug: modalSlug,
      depth: drawerDepth
    });
    const titleToRender = docTitle || getTranslation(getEntityConfig({
      collectionSlug
    }).labels.singular, i18n);
    let t2;
    if ($[20] !== className) {
      t2 = [baseClass, className].filter(Boolean);
      $[20] = className;
      $[21] = t2;
    } else {
      t2 = $[21];
    }
    t1 = _jsxs(_Fragment, {
      children: [_jsx(Button, {
        buttonStyle: "subtle",
        className: t2.join(" "),
        icon: _jsx(FolderIcon, {}),
        iconPosition: "left",
        onClick: () => {
          openModal(drawerSlug);
        },
        ...buttonProps,
        children: fromFolderName
      }), _jsx(MoveItemsToFolderDrawer, {
        action: "moveItemToFolder",
        drawerSlug,
        folderAssignedCollections: [collectionSlug],
        folderCollectionSlug,
        folderFieldName,
        fromFolderID,
        fromFolderName,
        itemsToMove: [{
          itemKey: `${collectionSlug}-${docID}`,
          relationTo: collectionSlug,
          value: {
            ...docData,
            id: docID
          }
        }],
        onConfirm: async args => {
          if (fromFolderID !== args.id && typeof onConfirm === "function") {
            ;
            try {
              await onConfirm(args);
              if (args.id) {
                toast.success(t("folder:itemHasBeenMoved", {
                  folderName: `"${args.name}"`,
                  title: titleToRender
                }));
              } else {
                toast.success(t("folder:itemHasBeenMovedToRoot", {
                  title: titleToRender
                }));
              }
            } catch (t3) {
              const _ = t3;
            }
          }
          closeModal(drawerSlug);
        },
        skipConfirmModal,
        title: titleToRender
      })]
    });
    $[0] = buttonProps;
    $[1] = className;
    $[2] = closeModal;
    $[3] = collectionSlug;
    $[4] = docData;
    $[5] = docID;
    $[6] = docTitle;
    $[7] = drawerDepth;
    $[8] = folderCollectionSlug;
    $[9] = folderFieldName;
    $[10] = fromFolderID;
    $[11] = fromFolderName;
    $[12] = getEntityConfig;
    $[13] = i18n;
    $[14] = modalSlug;
    $[15] = onConfirm;
    $[16] = openModal;
    $[17] = skipConfirmModal;
    $[18] = t;
    $[19] = t1;
  } else {
    t1 = $[19];
  }
  return t1;
};
//# sourceMappingURL=index.js.map
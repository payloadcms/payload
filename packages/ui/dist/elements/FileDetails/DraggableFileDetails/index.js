'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Button } from '../../Button/index.js';
import { Thumbnail } from '../../Thumbnail/index.js';
import './index.scss';
const baseClass = 'file-details-draggable';
import { DraggableSortableItem } from '../../../elements/DraggableSortable/DraggableSortableItem/index.js';
import { DragHandleIcon } from '../../../icons/DragHandle/index.js';
import { EditIcon } from '../../../icons/Edit/index.js';
import { useDocumentDrawer } from '../../DocumentDrawer/index.js';
export const DraggableFileDetails = props => {
  const $ = _c(20);
  const {
    collectionSlug,
    doc,
    hideRemoveFile,
    imageCacheTag,
    isSortable,
    removeItem,
    rowIndex,
    uploadConfig
  } = props;
  const {
    id,
    filename,
    thumbnailURL,
    url
  } = doc;
  let t0;
  if ($[0] !== collectionSlug || $[1] !== id) {
    t0 = {
      id,
      collectionSlug
    };
    $[0] = collectionSlug;
    $[1] = id;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer(t0);
  let t1;
  if ($[3] !== DocumentDrawer || $[4] !== DocumentDrawerToggler || $[5] !== collectionSlug || $[6] !== doc || $[7] !== filename || $[8] !== hideRemoveFile || $[9] !== imageCacheTag || $[10] !== isSortable || $[11] !== removeItem || $[12] !== rowIndex || $[13] !== thumbnailURL || $[14] !== uploadConfig || $[15] !== url) {
    t1 = draggableSortableItemProps => _jsxs("div", {
      className: [baseClass, draggableSortableItemProps && isSortable && `${baseClass}--has-drag-handle`].filter(Boolean).join(" "),
      ref: draggableSortableItemProps.setNodeRef,
      style: {
        transform: draggableSortableItemProps.transform,
        transition: draggableSortableItemProps.transition,
        zIndex: draggableSortableItemProps.isDragging ? 1 : undefined
      },
      children: [_jsxs("div", {
        className: `${baseClass}--drag-wrapper`,
        children: [isSortable && draggableSortableItemProps && _jsx("div", {
          className: `${baseClass}__drag`,
          ...draggableSortableItemProps.attributes,
          ...draggableSortableItemProps.listeners,
          children: _jsx(DragHandleIcon, {})
        }), _jsx(Thumbnail, {
          className: `${baseClass}__thumbnail`,
          collectionSlug,
          doc,
          fileSrc: thumbnailURL || url,
          imageCacheTag,
          uploadConfig
        })]
      }), _jsx("div", {
        className: `${baseClass}__main-detail`,
        children: filename
      }), _jsxs("div", {
        className: `${baseClass}__actions`,
        children: [_jsx(DocumentDrawer, {}), _jsx(DocumentDrawerToggler, {
          children: _jsx(EditIcon, {})
        }), !hideRemoveFile && removeItem && _jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__remove`,
          icon: "x",
          iconStyle: "none",
          onClick: () => removeItem(rowIndex),
          round: true
        })]
      })]
    });
    $[3] = DocumentDrawer;
    $[4] = DocumentDrawerToggler;
    $[5] = collectionSlug;
    $[6] = doc;
    $[7] = filename;
    $[8] = hideRemoveFile;
    $[9] = imageCacheTag;
    $[10] = isSortable;
    $[11] = removeItem;
    $[12] = rowIndex;
    $[13] = thumbnailURL;
    $[14] = uploadConfig;
    $[15] = url;
    $[16] = t1;
  } else {
    t1 = $[16];
  }
  let t2;
  if ($[17] !== id || $[18] !== t1) {
    t2 = _jsx(DraggableSortableItem, {
      id,
      children: t1
    }, id);
    $[17] = id;
    $[18] = t1;
    $[19] = t2;
  } else {
    t2 = $[19];
  }
  return t2;
};
//# sourceMappingURL=index.js.map
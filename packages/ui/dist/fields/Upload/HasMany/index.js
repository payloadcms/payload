'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { DraggableSortableItem } from '../../../elements/DraggableSortable/DraggableSortableItem/index.js';
import { DraggableSortable } from '../../../elements/DraggableSortable/index.js';
import { DragHandleIcon } from '../../../icons/DragHandle/index.js';
import { RelationshipContent } from '../RelationshipContent/index.js';
import { UploadCard } from '../UploadCard/index.js';
const baseClass = 'upload upload--has-many';
import { getBestFitFromSizes, isImage } from 'payload/shared';
import './index.scss';
export function UploadComponentHasMany(props) {
  const $ = _c(29);
  const {
    className,
    displayPreview,
    fileDocs,
    isSortable,
    onRemove,
    onReorder,
    readonly,
    reloadDoc,
    serverURL,
    showCollectionSlug: t0
  } = props;
  const showCollectionSlug = t0 === undefined ? false : t0;
  let t1;
  if ($[0] !== fileDocs || $[1] !== onReorder) {
    t1 = (moveFromIndex, moveToIndex) => {
      if (moveFromIndex === moveToIndex) {
        return;
      }
      const updatedArray = [...fileDocs];
      const [item] = updatedArray.splice(moveFromIndex, 1);
      updatedArray.splice(moveToIndex, 0, item);
      onReorder(updatedArray);
    };
    $[0] = fileDocs;
    $[1] = onReorder;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const moveRow = t1;
  let t2;
  if ($[3] !== fileDocs || $[4] !== onRemove) {
    t2 = index => {
      const updatedArray_0 = [...(fileDocs || [])];
      updatedArray_0.splice(index, 1);
      onRemove(updatedArray_0.length === 0 ? [] : updatedArray_0);
    };
    $[3] = fileDocs;
    $[4] = onRemove;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const removeItem = t2;
  let t3;
  if ($[6] !== className) {
    t3 = [baseClass, className].filter(Boolean);
    $[6] = className;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const t4 = t3.join(" ");
  let t5;
  if ($[8] !== displayPreview || $[9] !== fileDocs || $[10] !== isSortable || $[11] !== moveRow || $[12] !== readonly || $[13] !== reloadDoc || $[14] !== removeItem || $[15] !== serverURL || $[16] !== showCollectionSlug || $[17] !== t4) {
    let t6;
    if ($[19] !== moveRow) {
      t6 = t7 => {
        const {
          moveFromIndex: moveFromIndex_0,
          moveToIndex: moveToIndex_0
        } = t7;
        return moveRow(moveFromIndex_0, moveToIndex_0);
      };
      $[19] = moveRow;
      $[20] = t6;
    } else {
      t6 = $[20];
    }
    let t7;
    if ($[21] !== displayPreview || $[22] !== isSortable || $[23] !== readonly || $[24] !== reloadDoc || $[25] !== removeItem || $[26] !== serverURL || $[27] !== showCollectionSlug) {
      t7 = (t8, index_0) => {
        const {
          relationTo,
          value: value_0
        } = t8;
        const id = String(value_0.id);
        let src;
        let thumbnailSrc;
        if (value_0.url) {
          try {
            src = new URL(value_0.url, serverURL).toString();
          } catch {
            src = `${serverURL}${value_0.url}`;
          }
        }
        if (value_0.thumbnailURL) {
          try {
            thumbnailSrc = new URL(value_0.thumbnailURL, serverURL).toString();
          } catch {
            thumbnailSrc = `${serverURL}${value_0.thumbnailURL}`;
          }
        }
        if (isImage(value_0.mimeType)) {
          thumbnailSrc = getBestFitFromSizes({
            sizes: value_0.sizes,
            thumbnailURL: thumbnailSrc,
            url: src,
            width: value_0.width
          });
        }
        return _jsx(DraggableSortableItem, {
          disabled: !isSortable || readonly,
          id,
          children: draggableSortableItemProps => _jsx("div", {
            className: [`${baseClass}__dragItem`, draggableSortableItemProps && isSortable && `${baseClass}--has-drag-handle`].filter(Boolean).join(" "),
            ref: draggableSortableItemProps.setNodeRef,
            style: {
              transform: draggableSortableItemProps.transform,
              transition: draggableSortableItemProps.transition,
              zIndex: draggableSortableItemProps.isDragging ? 1 : undefined
            },
            children: _jsxs(UploadCard, {
              size: "small",
              children: [draggableSortableItemProps && _jsx("div", {
                className: `${baseClass}__drag`,
                ...draggableSortableItemProps.attributes,
                ...draggableSortableItemProps.listeners,
                children: _jsx(DragHandleIcon, {})
              }), _jsx(RelationshipContent, {
                allowEdit: !readonly,
                allowRemove: !readonly,
                alt: value_0?.alt || value_0?.filename,
                byteSize: value_0.filesize,
                collectionSlug: relationTo,
                displayPreview,
                filename: value_0.filename,
                id,
                mimeType: value_0?.mimeType,
                onRemove: () => removeItem(index_0),
                reloadDoc,
                showCollectionSlug,
                src,
                thumbnailSrc,
                updatedAt: value_0.updatedAt,
                withMeta: false,
                x: value_0?.width,
                y: value_0?.height
              })]
            })
          })
        }, id);
      };
      $[21] = displayPreview;
      $[22] = isSortable;
      $[23] = readonly;
      $[24] = reloadDoc;
      $[25] = removeItem;
      $[26] = serverURL;
      $[27] = showCollectionSlug;
      $[28] = t7;
    } else {
      t7 = $[28];
    }
    t5 = _jsx("div", {
      className: t4,
      children: _jsx(DraggableSortable, {
        className: `${baseClass}__draggable-rows`,
        ids: fileDocs?.map(_temp),
        onDragEnd: t6,
        children: fileDocs.map(t7)
      })
    });
    $[8] = displayPreview;
    $[9] = fileDocs;
    $[10] = isSortable;
    $[11] = moveRow;
    $[12] = readonly;
    $[13] = reloadDoc;
    $[14] = removeItem;
    $[15] = serverURL;
    $[16] = showCollectionSlug;
    $[17] = t4;
    $[18] = t5;
  } else {
    t5 = $[18];
  }
  return t5;
}
function _temp(t0) {
  const {
    value
  } = t0;
  return String(value.id);
}
//# sourceMappingURL=index.js.map
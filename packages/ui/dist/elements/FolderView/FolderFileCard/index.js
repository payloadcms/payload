'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDroppable } from '@dnd-kit/core';
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { DocumentIcon } from '../../../icons/Document/index.js';
import { ThreeDotsIcon } from '../../../icons/ThreeDots/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useFolder } from '../../../providers/Folders/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Popup } from '../../Popup/index.js';
import { Thumbnail } from '../../Thumbnail/index.js';
import { ColoredFolderIcon } from '../ColoredFolderIcon/index.js';
import { DraggableWithClick } from '../DraggableWithClick/index.js';
import './index.scss';
const baseClass = 'folder-file-card';
export function FolderFileCard({
  id,
  type,
  className = '',
  disabled = false,
  folderType,
  isDeleting = false,
  isFocused = false,
  isSelected = false,
  itemKey,
  onClick,
  onKeyDown,
  PopupActions,
  previewUrl,
  selectedCount = 0,
  title
}) {
  const disableDrop = !id || disabled || type !== 'folder';
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: itemKey,
    data: {
      id,
      type,
      folderType
    },
    disabled: disableDrop
  });
  const ref = React.useRef(null);
  React.useEffect(() => {
    const copyOfRef = ref.current;
    if (isFocused && ref.current) {
      ref.current.focus();
    } else if (!isFocused && ref.current) {
      ref.current.blur();
    }
    return () => {
      if (copyOfRef) {
        copyOfRef.blur();
      }
    };
  }, [isFocused]);
  return /*#__PURE__*/_jsxs(DraggableWithClick, {
    className: [baseClass, className, isSelected && `${baseClass}--selected`, disabled && `${baseClass}--disabled`, isDeleting && `${baseClass}--deleting`, isFocused && `${baseClass}--focused`, isOver && `${baseClass}--over`, `${baseClass}--${type}`].filter(Boolean).join(' '),
    disabled: disabled || !onClick && !onKeyDown,
    onClick: onClick,
    onKeyDown: onKeyDown,
    ref: ref,
    children: [!disableDrop ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__drop-area`,
      ref: setNodeRef
    }) : null, type === 'file' ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__preview-area`,
      children: previewUrl ? /*#__PURE__*/_jsx(Thumbnail, {
        fileSrc: previewUrl
      }) : /*#__PURE__*/_jsx(DocumentIcon, {})
    }) : null, /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__titlebar-area`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__icon-wrap`,
        children: type === 'file' ? /*#__PURE__*/_jsx(DocumentIcon, {}) : /*#__PURE__*/_jsx(ColoredFolderIcon, {})
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__titlebar-labels`,
        children: [/*#__PURE__*/_jsx("p", {
          className: `${baseClass}__name`,
          title: title,
          children: /*#__PURE__*/_jsx("span", {
            children: title
          })
        }), folderType && folderType.length > 0 ? /*#__PURE__*/_jsx(AssignedCollections, {
          folderType: folderType
        }) : null]
      }), PopupActions ? /*#__PURE__*/_jsx(Popup, {
        button: /*#__PURE__*/_jsx(ThreeDotsIcon, {}),
        disabled: selectedCount > 1 || selectedCount === 1 && !isSelected,
        horizontalAlign: "right",
        size: "large",
        verticalAlign: "bottom",
        children: PopupActions
      }) : null]
    })]
  }, itemKey);
}
function AssignedCollections({
  folderType
}) {
  const {
    config
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const collectionsDisplayText = React.useMemo(() => {
    return folderType.reduce((acc, collection) => {
      const collectionConfig = config.collections?.find(c => c.slug === collection);
      if (collectionConfig) {
        return [...acc, getTranslation(collectionConfig.labels.plural, i18n)];
      }
      return acc;
    }, []);
  }, [folderType, config.collections, i18n]);
  return /*#__PURE__*/_jsx("p", {
    className: `${baseClass}__assigned-collections`,
    children: collectionsDisplayText.map((label, index) => /*#__PURE__*/_jsxs("span", {
      children: [label, index < folderType.length - 1 ? ', ' : '']
    }, label))
  });
}
export function ContextFolderFileCard(t0) {
  const $ = _c(18);
  const {
    type,
    className,
    index,
    item
  } = t0;
  const {
    checkIfItemIsDisabled,
    focusedRowIndex,
    onItemClick,
    onItemKeyPress,
    selectedItemKeys
  } = useFolder();
  let t1;
  if ($[0] !== checkIfItemIsDisabled || $[1] !== className || $[2] !== focusedRowIndex || $[3] !== index || $[4] !== item || $[5] !== onItemClick || $[6] !== onItemKeyPress || $[7] !== selectedItemKeys || $[8] !== type) {
    const isSelected = selectedItemKeys.has(item.itemKey);
    const isDisabled = checkIfItemIsDisabled(item);
    let t2;
    if ($[10] !== index || $[11] !== item || $[12] !== onItemClick) {
      t2 = event => {
        onItemClick({
          event,
          index,
          item
        });
      };
      $[10] = index;
      $[11] = item;
      $[12] = onItemClick;
      $[13] = t2;
    } else {
      t2 = $[13];
    }
    let t3;
    if ($[14] !== index || $[15] !== item || $[16] !== onItemKeyPress) {
      t3 = event_0 => {
        onItemKeyPress({
          event: event_0,
          index,
          item
        });
      };
      $[14] = index;
      $[15] = item;
      $[16] = onItemKeyPress;
      $[17] = t3;
    } else {
      t3 = $[17];
    }
    t1 = _jsx(FolderFileCard, {
      className,
      disabled: isDisabled,
      folderType: item.value.folderType || [],
      id: item.value.id,
      isFocused: focusedRowIndex === index,
      isSelected,
      itemKey: item.itemKey,
      onClick: t2,
      onKeyDown: t3,
      previewUrl: item.value.url,
      title: item.value._folderOrDocumentTitle,
      type
    });
    $[0] = checkIfItemIsDisabled;
    $[1] = className;
    $[2] = focusedRowIndex;
    $[3] = index;
    $[4] = item;
    $[5] = onItemClick;
    $[6] = onItemKeyPress;
    $[7] = selectedItemKeys;
    $[8] = type;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  return t1;
}
//# sourceMappingURL=index.js.map
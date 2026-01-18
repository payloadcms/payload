'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { extractID } from 'payload/shared';
import React from 'react';
import { DocumentIcon } from '../../../icons/Document/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useFolder } from '../../../providers/Folders/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { formatDate } from '../../../utilities/formatDocTitle/formatDateTitle.js';
import { ColoredFolderIcon } from '../ColoredFolderIcon/index.js';
import { DraggableTableRow } from '../DraggableTableRow/index.js';
import { SimpleTable, TableHeader } from '../SimpleTable/index.js';
import './index.scss';
const baseClass = 'folder-file-table';
export function FolderFileTable(t0) {
  const $ = _c(39);
  const {
    showRelationCell: t1
  } = t0;
  const showRelationCell = t1 === undefined ? true : t1;
  const {
    checkIfItemIsDisabled,
    documents,
    focusedRowIndex,
    onItemClick,
    onItemKeyPress,
    selectedItemKeys,
    subfolders
  } = useFolder();
  const {
    config
  } = useConfig();
  const {
    i18n,
    t
  } = useTranslation();
  let t2;
  if ($[0] !== config || $[1] !== i18n) {
    t2 = () => {
      const map = {};
      config.collections.forEach(collection => {
        map[collection.slug] = {
          plural: getTranslation(collection.labels?.plural, i18n),
          singular: getTranslation(collection.labels?.singular, i18n)
        };
      });
      return map;
    };
    $[0] = config;
    $[1] = i18n;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const [relationToMap] = React.useState(t2);
  let t3;
  if ($[3] !== showRelationCell || $[4] !== t) {
    t3 = () => {
      const columnsToShow = [{
        name: "name",
        label: t("general:name")
      }, {
        name: "createdAt",
        label: t("general:createdAt")
      }, {
        name: "updatedAt",
        label: t("general:updatedAt")
      }];
      if (showRelationCell) {
        columnsToShow.push({
          name: "type",
          label: t("version:type")
        });
      }
      return columnsToShow;
    };
    $[3] = showRelationCell;
    $[4] = t;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const [columns] = React.useState(t3);
  let t4;
  if ($[6] !== checkIfItemIsDisabled || $[7] !== columns || $[8] !== config || $[9] !== documents || $[10] !== focusedRowIndex || $[11] !== i18n || $[12] !== onItemClick || $[13] !== onItemKeyPress || $[14] !== relationToMap || $[15] !== selectedItemKeys || $[16] !== subfolders) {
    let t5;
    if ($[18] !== checkIfItemIsDisabled || $[19] !== columns || $[20] !== config || $[21] !== focusedRowIndex || $[22] !== i18n || $[23] !== onItemClick || $[24] !== onItemKeyPress || $[25] !== relationToMap || $[26] !== selectedItemKeys) {
      t5 = (subfolder, rowIndex) => {
        const {
          itemKey,
          relationTo,
          value
        } = subfolder;
        const subfolderID = extractID(value);
        return _jsx(DraggableTableRow, {
          columns: columns.map((t6, index) => {
            const {
              name: name_0
            } = t6;
            let cellValue = "\u2014";
            if (name_0 === "name" && value._folderOrDocumentTitle !== undefined) {
              cellValue = value._folderOrDocumentTitle;
            }
            if ((name_0 === "createdAt" || name_0 === "updatedAt") && value[name_0]) {
              cellValue = formatDate({
                date: value[name_0],
                i18n,
                pattern: config.admin.dateFormat
              });
            }
            if (name_0 === "type") {
              cellValue = _jsxs(_Fragment, {
                children: [relationToMap[relationTo]?.singular || relationTo, Array.isArray(subfolder.value?.folderType) ? subfolder.value?.folderType.reduce((acc, slug, index_0) => {
                  if (index_0 === 0) {
                    return ` — ${relationToMap[slug]?.plural || slug}`;
                  }
                  if (index_0 > 0) {
                    return `${acc}, ${relationToMap[slug]?.plural || slug}`;
                  }
                  return acc;
                }, "") : ""]
              });
            }
            if (index === 0) {
              return _jsxs("span", {
                className: `${baseClass}__cell-with-icon`,
                children: [_jsx(ColoredFolderIcon, {}), cellValue]
              }, `${itemKey}-${name_0}`);
            } else {
              return cellValue;
            }
          }),
          disabled: checkIfItemIsDisabled(subfolder),
          dragData: {
            id: subfolderID,
            type: "folder"
          },
          id: subfolderID,
          isDroppable: true,
          isFocused: focusedRowIndex === rowIndex,
          isSelected: selectedItemKeys.has(itemKey),
          isSelecting: selectedItemKeys.size > 0,
          itemKey,
          onClick: event => {
            onItemClick({
              event,
              index: rowIndex,
              item: subfolder
            });
          },
          onKeyDown: event_0 => {
            onItemKeyPress({
              event: event_0,
              index: rowIndex,
              item: subfolder
            });
          }
        }, `${rowIndex}-${itemKey}`);
      };
      $[18] = checkIfItemIsDisabled;
      $[19] = columns;
      $[20] = config;
      $[21] = focusedRowIndex;
      $[22] = i18n;
      $[23] = onItemClick;
      $[24] = onItemKeyPress;
      $[25] = relationToMap;
      $[26] = selectedItemKeys;
      $[27] = t5;
    } else {
      t5 = $[27];
    }
    let t6;
    if ($[28] !== checkIfItemIsDisabled || $[29] !== columns || $[30] !== config || $[31] !== focusedRowIndex || $[32] !== i18n || $[33] !== onItemClick || $[34] !== onItemKeyPress || $[35] !== relationToMap || $[36] !== selectedItemKeys || $[37] !== subfolders.length) {
      t6 = (document, unadjustedIndex) => {
        const {
          itemKey: itemKey_0,
          relationTo: relationTo_0,
          value: value_0
        } = document;
        const documentID = extractID(value_0);
        const rowIndex_0 = unadjustedIndex + subfolders.length;
        return _jsx(DraggableTableRow, {
          columns: columns.map((t7, index_1) => {
            const {
              name: name_1
            } = t7;
            let cellValue_0 = "\u2014";
            if (name_1 === "name" && value_0._folderOrDocumentTitle !== undefined) {
              cellValue_0 = value_0._folderOrDocumentTitle;
            }
            if ((name_1 === "createdAt" || name_1 === "updatedAt") && value_0[name_1]) {
              cellValue_0 = formatDate({
                date: value_0[name_1],
                i18n,
                pattern: config.admin.dateFormat
              });
            }
            if (name_1 === "type") {
              cellValue_0 = relationToMap[relationTo_0]?.singular || relationTo_0;
            }
            if (index_1 === 0) {
              return _jsxs("span", {
                className: `${baseClass}__cell-with-icon`,
                children: [_jsx(DocumentIcon, {}), cellValue_0]
              }, `${itemKey_0}-${name_1}`);
            } else {
              return cellValue_0;
            }
          }),
          disabled: checkIfItemIsDisabled(document),
          dragData: {
            id: documentID,
            type: "document"
          },
          id: documentID,
          isFocused: focusedRowIndex === rowIndex_0,
          isSelected: selectedItemKeys.has(itemKey_0),
          isSelecting: selectedItemKeys.size > 0,
          itemKey: itemKey_0,
          onClick: event_1 => {
            onItemClick({
              event: event_1,
              index: rowIndex_0,
              item: document
            });
          },
          onKeyDown: event_2 => {
            onItemKeyPress({
              event: event_2,
              index: rowIndex_0,
              item: document
            });
          }
        }, `${rowIndex_0}-${itemKey_0}`);
      };
      $[28] = checkIfItemIsDisabled;
      $[29] = columns;
      $[30] = config;
      $[31] = focusedRowIndex;
      $[32] = i18n;
      $[33] = onItemClick;
      $[34] = onItemKeyPress;
      $[35] = relationToMap;
      $[36] = selectedItemKeys;
      $[37] = subfolders.length;
      $[38] = t6;
    } else {
      t6 = $[38];
    }
    t4 = _jsx(SimpleTable, {
      headerCells: columns.map(_temp),
      tableRows: [...subfolders.map(t5), ...documents.map(t6)]
    });
    $[6] = checkIfItemIsDisabled;
    $[7] = columns;
    $[8] = config;
    $[9] = documents;
    $[10] = focusedRowIndex;
    $[11] = i18n;
    $[12] = onItemClick;
    $[13] = onItemKeyPress;
    $[14] = relationToMap;
    $[15] = selectedItemKeys;
    $[16] = subfolders;
    $[17] = t4;
  } else {
    t4 = $[17];
  }
  return t4;
}
function _temp(t0) {
  const {
    name,
    label
  } = t0;
  return _jsx(TableHeader, {
    children: label
  }, name);
}
//# sourceMappingURL=index.js.map
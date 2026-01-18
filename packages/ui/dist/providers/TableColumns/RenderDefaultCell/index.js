'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js';
import { DefaultCell } from '../../../elements/Table/DefaultCell/index.js';
import { useTableColumns } from '../../../providers/TableColumns/index.js';
import './index.scss';
const baseClass = 'default-cell';
const CellPropsContext = /*#__PURE__*/React.createContext(null);
export const useCellProps = () => React.use(CellPropsContext);
export const RenderDefaultCell = t0 => {
  const $ = _c(9);
  const {
    clientProps,
    columnIndex,
    isLinkedColumn
  } = t0;
  const {
    drawerSlug,
    onSelect
  } = useListDrawerContext();
  const {
    LinkedCellOverride
  } = useTableColumns();
  let t1;
  if ($[0] !== LinkedCellOverride || $[1] !== clientProps || $[2] !== columnIndex || $[3] !== drawerSlug || $[4] !== isLinkedColumn || $[5] !== onSelect) {
    const propsToPass = {
      ...clientProps,
      columnIndex
    };
    if (isLinkedColumn && drawerSlug) {
      propsToPass.className = `${baseClass}__first-cell`;
      propsToPass.link = false;
      let t2;
      if ($[7] !== onSelect) {
        t2 = t3 => {
          const {
            collectionSlug: rowColl,
            rowData
          } = t3;
          if (typeof onSelect === "function") {
            onSelect({
              collectionSlug: rowColl,
              doc: rowData,
              docID: rowData.id
            });
          }
        };
        $[7] = onSelect;
        $[8] = t2;
      } else {
        t2 = $[8];
      }
      propsToPass.onClick = t2;
    }
    t1 = _jsx(CellPropsContext, {
      value: propsToPass,
      children: isLinkedColumn && LinkedCellOverride ? LinkedCellOverride : _jsx(DefaultCell, {
        ...propsToPass
      })
    });
    $[0] = LinkedCellOverride;
    $[1] = clientProps;
    $[2] = columnIndex;
    $[3] = drawerSlug;
    $[4] = isLinkedColumn;
    $[5] = onSelect;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
};
//# sourceMappingURL=index.js.map
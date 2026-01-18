'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared';
import React, { useId, useMemo } from 'react';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { useTableColumns } from '../../providers/TableColumns/index.js';
import { PillSelector } from '../PillSelector/index.js';
export const ColumnSelector = ({
  collectionSlug
}) => {
  const {
    columns,
    moveColumn,
    toggleColumn
  } = useTableColumns();
  const uuid = useId();
  const editDepth = useEditDepth();
  const filteredColumns = useMemo(() => columns?.filter(col => !(fieldIsHiddenOrDisabled(col.field) && !fieldIsID(col.field)) && !col?.field?.admin?.disableListColumn), [columns]);
  const pills = useMemo(() => {
    return filteredColumns ? filteredColumns.map((col_0, i) => {
      const {
        accessor,
        active,
        field
      } = col_0;
      const label = 'labelWithPrefix' in field && field.labelWithPrefix !== undefined ? field.labelWithPrefix : 'label' in field && field.label !== undefined ? field.label : 'name' in field && field.name !== undefined ? field.name : undefined;
      return {
        name: accessor,
        key: `${collectionSlug}-${accessor}-${i}${editDepth ? `-${editDepth}-` : ''}${uuid}`,
        Label: /*#__PURE__*/_jsx(FieldLabel, {
          label: label,
          unstyled: true
        }),
        selected: active
      };
    }) : null;
  }, [collectionSlug, editDepth, filteredColumns, uuid]);
  if (!pills) {
    return null;
  }
  return /*#__PURE__*/_jsx(PillSelector, {
    draggable: {
      onDragEnd: ({
        moveFromIndex,
        moveToIndex
      }) => {
        void moveColumn({
          fromIndex: moveFromIndex,
          toIndex: moveToIndex
        });
      }
    },
    onClick: ({
      pill
    }) => {
      void toggleColumn(pill.name);
    },
    pills: pills
  });
};
//# sourceMappingURL=index.js.map
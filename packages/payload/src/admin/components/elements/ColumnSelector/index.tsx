import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { Props } from './types';

import { getTranslation } from '../../../../utilities/getTranslation';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import { useEditDepth } from '../../utilities/EditDepth';
import DraggableSortable from '../DraggableSortable';
import Pill from '../Pill';
import { useTableColumns } from '../TableColumns';
import './index.scss';

const baseClass = 'column-selector';

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
  } = props;

  const {
    columns,
    moveColumn,
    toggleColumn,
  } = useTableColumns();

  const { i18n } = useTranslation();
  const uuid = useId();
  const editDepth = useEditDepth();

  if (!columns) { return null; }

  return (
    <DraggableSortable
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        moveColumn({
          fromIndex: moveFromIndex,
          toIndex: moveToIndex,
        });
      }}
      className={baseClass}
      ids={columns.map((col) => col.accessor)}
    >
      {columns.map((col, i) => {
        const {
          accessor,
          active,
          label,
          name,
        } = col;

        if (col.accessor === '_select') return null;

        return (
          <Pill
            className={[
              `${baseClass}__column`,
              active && `${baseClass}__column--active`,
            ].filter(Boolean).join(' ')}
            onClick={() => {
              toggleColumn(accessor);
            }}
            alignIcon="left"
            aria-checked={active}
            draggable
            icon={active ? <X /> : <Plus />}
            id={accessor}
            key={`${collection.slug}-${col.name || i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
          >
            {getTranslation(label || name, i18n)}
          </Pill>
        );
      })}
    </DraggableSortable>
  );
};

export default ColumnSelector;

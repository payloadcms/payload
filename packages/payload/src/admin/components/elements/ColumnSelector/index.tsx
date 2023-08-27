import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import Pill from '../Pill/index.js';
import Plus from '../../icons/Plus/index.js';
import X from '../../icons/X/index.js';
import { Props } from './types.js';
import { getTranslation } from '../../../../utilities/getTranslation.js';
import { useEditDepth } from '../../utilities/EditDepth/index.js';
import DraggableSortable from '../DraggableSortable/index.js';
import { useTableColumns } from '../TableColumns/index.js';

import './index.scss';

const baseClass = 'column-selector';

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
  } = props;

  const {
    columns,
    toggleColumn,
    moveColumn,
  } = useTableColumns();

  const { i18n } = useTranslation();
  const uuid = useId();
  const editDepth = useEditDepth();

  if (!columns) { return null; }

  return (
    <DraggableSortable
      className={baseClass}
      ids={columns.map((col) => col.accessor)}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        moveColumn({
          fromIndex: moveFromIndex,
          toIndex: moveToIndex,
        });
      }}
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
            draggable
            id={accessor}
            onClick={() => {
              toggleColumn(accessor);
            }}
            alignIcon="left"
            key={`${collection.slug}-${col.name || i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
            icon={active ? <X /> : <Plus />}
            aria-checked={active}
            className={[
              `${baseClass}__column`,
              active && `${baseClass}__column--active`,
            ].filter(Boolean).join(' ')}
          >
            {getTranslation(label || name, i18n)}
          </Pill>
        );
      })}
    </DraggableSortable>
  );
};

export default ColumnSelector;

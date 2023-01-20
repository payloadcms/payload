/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import DragHandle from '../../icons/Drag';
import { Props } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { useEditDepth } from '../../utilities/EditDepth';
import { Field } from '../../../../fields/config/types';
import DraggableSortable from '../DraggableSortable';
import DraggableSortableItem from '../DraggableSortable/DraggableSortableItem';

import './index.scss';

const baseClass = 'column-selector';

const sortedFlatFields = (fields: Field[], columns: string[]) => {
  const _fields = flattenTopLevelFields(fields, true);
  return [
    ...columns.map((column) => _fields.find((f) => f.name === column)),
    ..._fields.filter((f) => !columns.find((c) => c === f.name)),
  ];
};

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
    columns,
    setColumns,
  } = props;

  const [fields, setFields] = useState(() => sortedFlatFields(collection.fields, columns));

  useEffect(() => {
    setFields(sortedFlatFields(collection.fields, columns));
  }, [collection.fields]);

  const { i18n } = useTranslation();
  const uuid = useId();
  const editDepth = useEditDepth();

  const moveColumn = useCallback((moveFromIndex: number, moveToIndex: number) => {
    const newState = [...fields];
    const element = fields[moveFromIndex];
    newState.splice(moveFromIndex, 1);
    newState.splice(moveToIndex, 0, element);
    setFields(newState);
    setColumns(newState.filter((field) => columns.find((column) => column === field.name)).map((field) => field.name));
  }, [columns, fields, setColumns, setFields]);

  if (!fields) { return null; }

  return (
    <DraggableSortable
      className={baseClass}
      ids={fields.map((field) => field.name)}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        moveColumn(moveFromIndex, moveToIndex);
      }}
    >
      {fields.map((field, i) => {
        const isEnabled = columns.find((column) => column === field.name);
        return (
          <DraggableSortableItem
            id={field.name}
            key={field.name}
          >
            {({ setNodeRef, transform, attributes, listeners }) => (
              <div
                id={`col-${field.name}`}
                ref={setNodeRef}
                className={`${baseClass}__column_container`}
                style={{
                  transform,
                }}
              >
                <span
                  className={`${baseClass}__drag`}
                  {...listeners}
                  {...attributes}
                >
                  <DragHandle />
                </span>
                <Pill
                  onClick={() => {
                    if (isEnabled) {
                      setColumns(columns.filter((remainingColumn) => remainingColumn !== field.name));
                    } else {
                      setColumns(fields
                        .filter((f) => columns.find((column) => column === f.name) || f.name === field.name)
                        .map((f) => f.name));
                    }
                  }}
                  alignIcon="left"
                  key={`${field.name || i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
                  icon={isEnabled ? <X /> : <Plus />}
                  className={[
                    `${baseClass}__column`,
                    isEnabled && `${baseClass}__column--active`,
                  ].filter(Boolean).join(' ')}
                >
                  {getTranslation(field.label || field.name, i18n)}
                </Pill>
              </div>
            )}
          </DraggableSortableItem>
        );
      })}
      ;
    </DraggableSortable>
  );
};

export default ColumnSelector;

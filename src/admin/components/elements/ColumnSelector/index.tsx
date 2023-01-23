import React, { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import { Props } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { useEditDepth } from '../../utilities/EditDepth';
import { Field } from '../../../../fields/config/types';
import DraggableSortable from '../DraggableSortable';

import './index.scss';

const baseClass = 'column-selector';

const sortFields = (fields: Field[], columns: string[]) => {
  const flattenedFields = flattenTopLevelFields(fields, true);
  return [
    ...columns.map((column) => flattenedFields.find((f) => f.name === column)),
    ...flattenedFields.filter((f) => !columns.find((c) => c === f.name)),
  ];
};

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
    columns,
    setColumns,
  } = props;

  const [fields, setFields] = useState(() => sortFields(collection.fields, columns));

  useEffect(() => {
    setFields(sortFields(collection.fields, columns));
  }, [columns, collection.fields]);

  const { i18n } = useTranslation();
  const uuid = useId();
  const editDepth = useEditDepth();

  const moveColumn = useCallback((moveFromIndex: number, moveToIndex: number) => {
    const sortedFields = [...fields];
    sortedFields.splice(moveFromIndex, 1);
    sortedFields.splice(moveToIndex, 0, fields[moveFromIndex]);
    const sortedColumns = sortedFields.filter((field) => columns.find((column) => column === field.name)).map((field) => field.name);
    setColumns(sortedColumns);
  }, [columns, fields, setColumns]);

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
          <Pill
            draggable
            id={field.name}
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
        );
      })}
    </DraggableSortable>
  );
};

export default ColumnSelector;

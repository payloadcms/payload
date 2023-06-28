import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Collapsible } from '../../../elements/Collapsible';
import RenderFields from '../../RenderFields';
import { Props } from './types';
import { ArrayAction } from '../../../elements/ArrayAction';
import HiddenInput from '../HiddenInput';
import { RowLabel } from '../../RowLabel';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { createNestedFieldPath } from '../../Form/createNestedFieldPath';
import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types';
import type { Row } from '../../Form/types';
import type { RowLabel as RowLabelType } from '../../RowLabel/types';
import Pill from '../../../elements/Pill';

import './index.scss';

const baseClass = 'array-field';

type ArrayRowProps = UseDraggableSortableReturn & Pick<Props, 'fields' | 'path' | 'indexPath' | 'fieldTypes' | 'permissions' | 'labels'> & {
  addRow: (rowIndex: number) => void
  duplicateRow: (rowIndex: number) => void
  removeRow: (rowIndex: number) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  setCollapse: (rowID: string, collapsed: boolean) => void
  rowCount: number
  rowIndex: number
  row: Row
  CustomRowLabel?: RowLabelType
  readOnly?: boolean
  rowErrorCount: number
}
export const ArrayRow: React.FC<ArrayRowProps> = ({
  path: parentPath,
  addRow,
  removeRow,
  moveRow,
  duplicateRow,
  setCollapse,
  transform,
  listeners,
  attributes,
  setNodeRef,
  row,
  rowIndex,
  rowCount,
  indexPath,
  readOnly,
  labels,
  fieldTypes,
  permissions,
  CustomRowLabel,
  fields,
  rowErrorCount = 0,
}) => {
  const path = `${parentPath}.${rowIndex}`;
  const { i18n } = useTranslation();

  const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowIndex + 1).padStart(2, '0')}`;

  const classNames = [
    `${baseClass}__row`,
    rowErrorCount > 0 ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ].filter(Boolean).join(' ');

  useEffect(() => {
    console.log(path, rowErrorCount);
  });

  return (
    <div
      key={`${path}-row-${row.id}`}
      id={`${path}-row-${rowIndex}`}
      ref={setNodeRef}
      style={{
        transform,
      }}
    >
      <Collapsible
        collapsed={row.collapsed}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
        className={classNames}
        collapsibleStyle={rowErrorCount > 0 ? 'error' : 'default'}
        dragHandleProps={{
          id: row.id,
          attributes,
          listeners,
        }}
        header={(
          <React.Fragment>
            <RowLabel
              path={path}
              label={CustomRowLabel || fallbackLabel}
              rowNumber={rowIndex + 1}
            />
            {rowErrorCount > 0 && (
              <Pill
                pillStyle="error"
                rounded
                className={`${baseClass}__row-error-pill`}
              >
                {rowErrorCount}
              </Pill>
            )}
          </React.Fragment>
        )}
        actions={!readOnly ? (
          <ArrayAction
            addRow={addRow}
            removeRow={removeRow}
            moveRow={moveRow}
            duplicateRow={duplicateRow}
            rowCount={rowCount}
            index={rowIndex}
          />
        ) : undefined}
      >
        <HiddenInput
          name={`${path}.id`}
          value={row.id}
        />
        <RenderFields
          className={`${baseClass}__fields`}
          readOnly={readOnly}
          fieldTypes={fieldTypes}
          permissions={permissions?.fields}
          indexPath={indexPath}
          fieldSchema={fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
        />
      </Collapsible>
    </div>
  );
};

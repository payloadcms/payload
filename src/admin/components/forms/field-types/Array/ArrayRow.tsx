import React from 'react';
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
import { useFormSubmitted } from '../../Form/context';
import { ErrorPill } from '../../../elements/ErrorPill';

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
}) => {
  const path = `${parentPath}.${rowIndex}`;
  const { i18n } = useTranslation();
  const hasSubmitted = useFormSubmitted();

  const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowIndex + 1).padStart(2, '0')}`;

  const childErrorPathsCount = row.childErrorPaths?.size;
  const fieldHasErrors = hasSubmitted && childErrorPathsCount > 0;

  const classNames = [
    `${baseClass}__row`,
    fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ].filter(Boolean).join(' ');

  return (
    <div
      key={`${parentPath}-row-${row.id}`}
      id={`${parentPath.split('.').join('-')}-row-${rowIndex}`}
      ref={setNodeRef}
      style={{
        transform,
      }}
    >
      <Collapsible
        collapsed={row.collapsed}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
        className={classNames}
        collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
        dragHandleProps={{
          id: row.id,
          attributes,
          listeners,
        }}
        header={(
          <div className={`${baseClass}__row-header`}>
            <RowLabel
              path={path}
              label={CustomRowLabel || fallbackLabel}
              rowNumber={rowIndex + 1}
            />
            {fieldHasErrors && (
              <ErrorPill
                count={childErrorPathsCount}
                withMessage
              />
            )}
          </div>
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

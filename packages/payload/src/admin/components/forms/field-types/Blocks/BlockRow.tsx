import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Block } from '../../../../../fields/config/types.js';
import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types.js';
import type { Row } from '../../Form/types.js';
import type { Props } from './types.js';

import { getTranslation } from '../../../../../utilities/getTranslation.js';
import { Collapsible } from '../../../elements/Collapsible/index.js';
import { ErrorPill } from '../../../elements/ErrorPill/index.js';
import Pill from '../../../elements/Pill/index.js';
import { useFormSubmitted } from '../../Form/context.js';
import { createNestedFieldPath } from '../../Form/createNestedFieldPath.js';
import RenderFields from '../../RenderFields/index.js';
import HiddenInput from '../HiddenInput/index.js';
import { RowActions } from './RowActions.js';
import SectionTitle from './SectionTitle/index.js';

const baseClass = 'blocks-field';

type BlockFieldProps = UseDraggableSortableReturn & Pick<Props, 'blocks' | 'fieldTypes' | 'indexPath' | 'labels' | 'path' | 'permissions'> & {
  addRow: (rowIndex: number, blockType: string) => void
  blockToRender: Block
  duplicateRow: (rowIndex: number) => void
  hasMaxRows?: boolean
  moveRow: (fromIndex: number, toIndex: number) => void
  readOnly: boolean
  removeRow: (rowIndex: number) => void
  row: Row
  rowCount: number
  rowIndex: number
  setCollapse: (id: string, collapsed: boolean) => void
}
export const BlockRow: React.FC<BlockFieldProps> = ({
  addRow,
  attributes,
  blockToRender,
  blocks,
  duplicateRow,
  fieldTypes,
  hasMaxRows,
  indexPath,
  labels,
  listeners,
  moveRow,
  path: parentPath,
  permissions,
  readOnly,
  removeRow,
  row,
  rowCount,
  rowIndex,
  setCollapse,
  setNodeRef,
  transform,
}) => {
  const path = `${parentPath}.${rowIndex}`;
  const { i18n } = useTranslation();
  const hasSubmitted = useFormSubmitted();

  const childErrorPathsCount = row.childErrorPaths?.size;
  const fieldHasErrors = hasSubmitted && childErrorPathsCount > 0;

  const classNames = [
    `${baseClass}__row`,
    fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ].filter(Boolean).join(' ');

  return (
    <div
      style={{
        transform,
      }}
      id={`${parentPath.split('.').join('-')}-row-${rowIndex}`}
      key={`${parentPath}-row-${rowIndex}`}
      ref={setNodeRef}
    >
      <Collapsible
        actions={!readOnly ? (
          <RowActions
            addRow={addRow}
            blockType={row.blockType}
            blocks={blocks}
            duplicateRow={duplicateRow}
            hasMaxRows={hasMaxRows}
            labels={labels}
            moveRow={moveRow}
            removeRow={removeRow}
            rowCount={rowCount}
            rowIndex={rowIndex}
          />
        ) : undefined}
        dragHandleProps={{
          attributes,
          id: row.id,
          listeners,
        }}
        header={(
          <div className={`${baseClass}__block-header`}>
            <span className={`${baseClass}__block-number`}>
              {String(rowIndex + 1).padStart(2, '0')}
            </span>
            <Pill
              className={`${baseClass}__block-pill ${baseClass}__block-pill-${row.blockType}`}
              pillStyle="white"
            >
              {getTranslation(blockToRender.labels.singular, i18n)}
            </Pill>
            <SectionTitle
              path={`${path}.blockName`}
              readOnly={readOnly}
            />
            {fieldHasErrors && (
              <ErrorPill
                count={childErrorPathsCount}
                withMessage
              />
            )}
          </div>
        )}
        className={classNames}
        collapsed={row.collapsed}
        collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
        key={row.id}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <HiddenInput
          name={`${path}.id`}
          value={row.id}
        />
        <RenderFields
          fieldSchema={blockToRender.fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
          className={`${baseClass}__fields`}
          fieldTypes={fieldTypes}
          indexPath={indexPath}
          permissions={permissions?.blocks?.[row.blockType]?.fields}
          readOnly={readOnly}
        />
      </Collapsible>
    </div>
  );
};

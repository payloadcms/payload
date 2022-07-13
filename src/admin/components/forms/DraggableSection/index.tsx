import React, { useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import ActionPanel from './ActionPanel';
import SectionTitle from './SectionTitle';
import PositionPanel from './PositionPanel';
import Button from '../../elements/Button';
import { NegativeFieldGutterProvider } from '../FieldTypeGutter/context';
import FieldTypeGutter from '../FieldTypeGutter';
import RenderFields from '../RenderFields';
import { Props } from './types';
import HiddenInput from '../field-types/HiddenInput';
import { fieldAffectsData } from '../../../../fields/config/types';

import './index.scss';

const baseClass = 'draggable-section';

const DraggableSection: React.FC<Props> = (props) => {
  const {
    moveRow,
    addRow,
    removeRow,
    rowIndex,
    rowCount,
    parentPath,
    fieldSchema,
    label,
    blockType,
    fieldTypes,
    id,
    setRowCollapse,
    isCollapsed,
    permissions,
    readOnly,
    hasMaxRows,
  } = props;

  const [isHovered, setIsHovered] = useState(false);

  const classes = [
    baseClass,
    isCollapsed ? 'is-collapsed' : 'is-open',
    (isHovered && !readOnly) && 'is-hovered',
  ].filter(Boolean).join(' ');

  return (
    <Draggable
      draggableId={id}
      index={rowIndex}
      isDragDisabled={readOnly}
    >
      {(providedDrag) => (
        <div
          ref={providedDrag.innerRef}
          className={classes}
          onMouseLeave={() => setIsHovered(false)}
          onMouseOver={() => setIsHovered(true)}
          onFocus={() => setIsHovered(true)}
          {...providedDrag.draggableProps}
        >

          <div className={`${baseClass}__content-wrapper`}>
            <FieldTypeGutter
              variant="left"
              dragHandleProps={providedDrag.dragHandleProps}
            >
              <PositionPanel
                moveRow={moveRow}
                rowCount={rowCount}
                positionIndex={rowIndex}
                readOnly={readOnly}
              />
            </FieldTypeGutter>

            <div className={`${baseClass}__render-fields-wrapper`}>

              {blockType === 'blocks' && (
                <div className={`${baseClass}__section-header`}>
                  <HiddenInput
                    name={`${parentPath}.${rowIndex}.id`}
                    value={id}
                  />
                  <SectionTitle
                    label={label}
                    path={`${parentPath}.${rowIndex}.blockName`}
                    readOnly={readOnly}
                  />

                  <Button
                    icon="chevron"
                    onClick={() => setRowCollapse(id, !isCollapsed)}
                    buttonStyle="icon-label"
                    className={`toggle-collapse toggle-collapse--is-${isCollapsed ? 'collapsed' : 'open'}`}
                    round
                  />
                </div>
              )}

              <AnimateHeight
                height={isCollapsed ? 0 : 'auto'}
                duration={200}
              >
                <NegativeFieldGutterProvider allow={false}>
                  <RenderFields
                    readOnly={readOnly}
                    fieldTypes={fieldTypes}
                    key={rowIndex}
                    permissions={permissions?.fields}
                    fieldSchema={fieldSchema.map((field) => ({
                      ...field,
                      path: `${parentPath}.${rowIndex}${fieldAffectsData(field) ? `.${field.name}` : ''}`,
                    }))}
                  />
                </NegativeFieldGutterProvider>
              </AnimateHeight>
            </div>

            <FieldTypeGutter
              variant="right"
              className="actions"
              dragHandleProps={providedDrag.dragHandleProps}
            >
              {!readOnly && (
                <ActionPanel
                  addRow={addRow}
                  removeRow={removeRow}
                  rowIndex={rowIndex}
                  label={label}
                  isHovered={isHovered}
                  hasMaxRows={hasMaxRows}
                  {...props}
                />
              )}
            </FieldTypeGutter>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default DraggableSection;

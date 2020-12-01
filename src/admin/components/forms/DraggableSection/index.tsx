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
    toggleRowCollapse,
    id,
    positionPanelVerticalAlignment = 'sticky',
    actionPanelVerticalAlignment = 'sticky',
    permissions,
    isOpen,
    readOnly,
  } = props;

  const [isHovered, setIsHovered] = useState(false);

  const classes = [
    baseClass,
    isOpen ? 'is-open' : 'is-closed',
    isHovered && 'is-hovered',
  ].filter(Boolean).join(' ');

  return (
    <Draggable
      draggableId={id}
      index={rowIndex}
      isDropDisabled={readOnly}
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
                verticalAlignment={positionPanelVerticalAlignment}
              />
            </FieldTypeGutter>

            <div className={`${baseClass}__render-fields-wrapper`}>

              {blockType === 'blocks' && (
                <div className={`${baseClass}__section-header`}>
                  <SectionTitle
                    label={label}
                    path={`${parentPath}.${rowIndex}.blockName`}
                    readOnly={readOnly}
                  />

                  <Button
                    icon="chevron"
                    onClick={toggleRowCollapse}
                    buttonStyle="icon-label"
                    className={`toggle-collapse toggle-collapse--is-${isOpen ? 'open' : 'closed'}`}
                    round
                  />
                </div>
              )}

              <AnimateHeight
                height={isOpen ? 'auto' : 0}
                duration={0}
              >
                <NegativeFieldGutterProvider allow={false}>
                  <RenderFields
                    readOnly={readOnly}
                    fieldTypes={fieldTypes}
                    key={rowIndex}
                    permissions={permissions?.fields}
                    fieldSchema={fieldSchema.map((field) => ({
                      ...field,
                      path: `${parentPath}.${rowIndex}${field.name ? `.${field.name}` : ''}`,
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
                  rowIndex={rowIndex}
                  addRow={addRow}
                  removeRow={removeRow}
                  label={label}
                  verticalAlignment={actionPanelVerticalAlignment}
                  isHovered={isHovered}
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

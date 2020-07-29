import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import ActionPanel from './ActionPanel';
import SectionTitle from './SectionTitle';
import PositionPanel from './PositionPanel';
import Button from '../../elements/Button';
import FieldTypeGutter from '../FieldTypeGutter';
import RenderFields from '../RenderFields';


import './index.scss';

const baseClass = 'draggable-section';

const DraggableSection = (props) => {
  const {
    moveRow,
    addRow,
    removeRow,
    rowIndex,
    rowCount,
    parentPath,
    fieldSchema,
    singularLabel,
    blockType,
    fieldTypes,
    customComponentsPath,
    toggleRowCollapse,
    id,
    positionPanelVerticalAlignment,
    actionPanelVerticalAlignment,
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
                    label={singularLabel}
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
                <RenderFields
                  readOnly={readOnly}
                  customComponentsPath={customComponentsPath}
                  fieldTypes={fieldTypes}
                  key={rowIndex}
                  permissions={permissions}
                  fieldSchema={fieldSchema.map((field) => ({
                    ...field,
                    path: `${parentPath}.${rowIndex}${field.name ? `.${field.name}` : ''}`,
                  }))}
                />
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
                  singularLabel={singularLabel}
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

DraggableSection.defaultProps = {
  toggleRowCollapse: undefined,
  rowCount: null,
  initialData: undefined,
  singularLabel: '',
  blockType: '',
  customComponentsPath: '',
  isOpen: true,
  positionPanelVerticalAlignment: 'sticky',
  actionPanelVerticalAlignment: 'sticky',
  permissions: {},
  readOnly: false,
};

DraggableSection.propTypes = {
  moveRow: PropTypes.func.isRequired,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  toggleRowCollapse: PropTypes.func,
  rowIndex: PropTypes.number.isRequired,
  parentPath: PropTypes.string.isRequired,
  singularLabel: PropTypes.string,
  fieldSchema: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  rowCount: PropTypes.number,
  initialData: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape({})]),
  isOpen: PropTypes.bool,
  blockType: PropTypes.string,
  fieldTypes: PropTypes.shape({}).isRequired,
  customComponentsPath: PropTypes.string,
  id: PropTypes.string.isRequired,
  positionPanelVerticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
  actionPanelVerticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
  permissions: PropTypes.shape({}),
  readOnly: PropTypes.bool,
};

export default DraggableSection;

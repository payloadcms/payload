import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import ActionPanel from './ActionPanel';
import SectionTitle from './SectionTitle';
import PositionPanel from './PositionPanel';
import RenderFields from '../RenderFields';

import './index.scss';
import Button from '../../elements/Button';

const baseClass = 'draggable-section';

const DraggableSection = (props) => {
  const {
    moveRow,
    addRow,
    removeRow,
    rowIndex,
    parentPath,
    fieldSchema,
    initialData,
    singularLabel,
    blockType,
    fieldTypes,
    customComponentsPath,
    isOpen,
    id,
    positionPanelVerticalAlignment,
    actionPanelVerticalAlignment,
    toggleRowCollapse,
  } = props;

  const [isHovered, setIsHovered] = useState(false);

  const classes = [
    baseClass,
    isOpen && 'is-open',
    isHovered && 'is-hovered',
  ].filter(Boolean).join(' ');

  return (
    <Draggable
      draggableId={id}
      index={rowIndex}
    >
      {(providedDrag) => {
        return (
          <div
            ref={providedDrag.innerRef}
            className={classes}
            onMouseLeave={() => setIsHovered(false)}
            onMouseOver={() => setIsHovered(true)}
            onFocus={() => setIsHovered(true)}
            {...providedDrag.draggableProps}
          >

            <PositionPanel
              dragHandleProps={providedDrag.dragHandleProps}
              moveRow={moveRow}
              positionIndex={rowIndex}
              verticalAlignment={positionPanelVerticalAlignment}
            />

            <div className={`${baseClass}__render-fields-wrapper`}>

              {blockType === 'flexible' && (
                <div className={`${baseClass}__section-header`}>
                  <SectionTitle
                    label={singularLabel}
                    initialData={initialData?.blockName}
                    path={`${parentPath}.${rowIndex}.blockName`}
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
                  initialData={initialData}
                  customComponentsPath={customComponentsPath}
                  fieldTypes={fieldTypes}
                  key={rowIndex}
                  fieldSchema={fieldSchema.map((field) => {
                    return ({
                      ...field,
                      path: `${parentPath}.${rowIndex}${field.name ? `.${field.name}` : ''}`,
                    });
                  })}
                />
              </AnimateHeight>
            </div>

            <ActionPanel
              removeRow={removeRow}
              addRow={addRow}
              singularLabel={singularLabel}
              verticalAlignment={actionPanelVerticalAlignment}
            />
          </div>
        );
      }}
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
};

export default DraggableSection;

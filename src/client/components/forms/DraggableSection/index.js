import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import ActionHandle from './ActionHandle';
import SectionTitle from './SectionTitle';
import PositionHandle from './PositionHandle';
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
    positionHandleVerticalAlignment,
    actionHandleVerticalAlignment,
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

            <PositionHandle
              dragHandleProps={providedDrag.dragHandleProps}
              moveRow={moveRow}
              positionIndex={rowIndex}
              verticalAlignment={positionHandleVerticalAlignment}
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

            <ActionHandle
              removeRow={removeRow}
              addRow={addRow}
              singularLabel={singularLabel}
              verticalAlignment={actionHandleVerticalAlignment}
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
  positionHandleVerticalAlignment: 'center',
  actionHandleVerticalAlignment: 'center',
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
  positionHandleVerticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
  actionHandleVerticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
};

export default DraggableSection;

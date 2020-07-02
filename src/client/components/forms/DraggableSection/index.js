import React, { useState } from 'react';
import PropTypes from 'prop-types';
// import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import ActionHandle from './ActionHandle';
import SectionTitle from './SectionTitle';
import PositionHandle from './PositionHandle';
import RenderFields from '../RenderFields';

import './index.scss';

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
    // dispatchRows,
    singularLabel,
    blockType,
    fieldTypes,
    customComponentsPath,
    isOpen,
    id,
    positionHandleVerticalAlignment,
    actionHandleVerticalAlignment,
    permissions,
  } = props;

  // const draggableRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // const handleCollapseClick = () => {
  //   draggableRef.current.focus();
  //   dispatchRows({
  //     type: 'UPDATE_COLLAPSIBLE_STATUS',
  //     index: rowIndex,
  //   });
  // };

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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
                <SectionTitle
                  label={singularLabel}
                  initialData={initialData?.blockName}
                  path={`${parentPath}.${rowIndex}.blockName`}
                />
              )}

              {/* Render fields */}
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
            </div>

            <ActionHandle
              removeRow={removeRow}
              addRow={addRow}
              rowIndex={rowIndex}
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
  rowIndex: PropTypes.number.isRequired,
  parentPath: PropTypes.string.isRequired,
  singularLabel: PropTypes.string,
  fieldSchema: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  rowCount: PropTypes.number,
  initialData: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape({})]),
  dispatchRows: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  blockType: PropTypes.string,
  fieldTypes: PropTypes.shape({}).isRequired,
  customComponentsPath: PropTypes.string,
  id: PropTypes.string.isRequired,
  positionHandleVerticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
  actionHandleVerticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
};

export default DraggableSection;

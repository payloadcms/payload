import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';
import RenderFields from '../RenderFields';

import IconButton from '../../elements/IconButton';
import Pill from '../../elements/Pill';
import Chevron from '../../icons/Chevron';

import './index.scss';
import EditableBlockTitle from './EditableBlockTitle';

const baseClass = 'draggable-section';

const DraggableSection = (props) => {
  const {
    addRow,
    removeRow,
    rowIndex,
    parentPath,
    fieldSchema,
    initialData,
    dispatchRows,
    singularLabel,
    blockType,
    fieldTypes,
    customComponentsPath,
    isOpen,
    id,
  } = props;

  const draggableRef = useRef(null);

  const handleCollapseClick = () => {
    draggableRef.current.focus();
    dispatchRows({
      type: 'UPDATE_COLLAPSIBLE_STATUS',
      index: rowIndex,
    });
  };

  const classes = [
    baseClass,
    isOpen && 'is-open',
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
            {...providedDrag.draggableProps}
          >
            <div className={`${baseClass}__header`}>
              <div
                {...providedDrag.dragHandleProps}
                className={`${baseClass}__header__drag-handle`}
                onClick={() => handleCollapseClick(providedDrag)}
                role="button"
                tabIndex={0}
                ref={draggableRef}
              />

              <div className={`${baseClass}__header__row-block-type-label`}>
                {blockType === 'flexible'
                  ? <Pill>{singularLabel}</Pill>
                  : `${singularLabel} ${rowIndex + 1}`
                }
              </div>

              {blockType === 'flexible'
                && (
                  <EditableBlockTitle
                    initialData={initialData?.blockName}
                    path={`${parentPath}.${rowIndex}.blockName`}
                  />
                )
              }

              <div className={`${baseClass}__header__controls`}>

                <IconButton
                  iconName="Plus"
                  onClick={addRow}
                  size="small"
                />

                <IconButton
                  iconName="X"
                  onClick={removeRow}
                  size="small"
                />

                <Chevron isOpen={isOpen} />
              </div>
            </div>

            <AnimateHeight
              className={`${baseClass}__content`}
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
};

DraggableSection.propTypes = {
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
};

export default DraggableSection;

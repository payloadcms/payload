import React from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import RenderFields from '../RenderFields'; // eslint-disable-line import/no-cycle
import IconButton from '../../controls/IconButton';
import Pill from '../../modules/Pill';
import Chevron from '../../graphics/Chevron';

import './index.scss';

const baseClass = 'draggable-section';

const DraggableSection = (props) => {
  const {
    addRow,
    removeRow,
    rowIndex,
    parentName,
    renderFields,
    defaultValue,
    dispatchCollapsibleStates,
    collapsibleStates,
    singularLabel,
    useHeadingPill,
  } = props;

  const handleCollapseClick = () => {
    dispatchCollapsibleStates({
      type: 'UPDATE_COLLAPSIBLE_STATUS',
      collapsibleIndex: rowIndex,
    });
  };

  return (
    <Draggable
      draggableId={`row-${rowIndex}`}
      index={rowIndex}
    >
      {(providedDrag) => {
        return (
          <div
            ref={providedDrag.innerRef}
            className={baseClass}
            {...providedDrag.draggableProps}
          >
            <div className={`${baseClass}__header`}>
              <div
                {...providedDrag.dragHandleProps}
                className={`${baseClass}__header__drag-handle`}
                onClick={handleCollapseClick}
                role="button"
                tabIndex={0}
              />

              <div className={`${baseClass}__header__row-name`}>
                {useHeadingPill
                  ? <Pill>{singularLabel}</Pill>
                  : `${singularLabel} ${rowIndex + 1}`
                }
              </div>

              <div className={`${baseClass}__header__controls`}>

                <IconButton
                  iconName="crosshair"
                  onClick={addRow}
                  size="small"
                />

                <IconButton
                  iconName="crossOut"
                  onClick={removeRow}
                  size="small"
                />

                <Chevron isOpen={collapsibleStates[rowIndex]} />
              </div>
            </div>

            <AnimateHeight
              className={`${baseClass}__content`}
              height={collapsibleStates[rowIndex] ? 'auto' : 0}
              duration={0}
            >
              <RenderFields
                key={rowIndex}
                fields={renderFields.map((field) => {
                  const fieldName = `${parentName}.${rowIndex}.${field.name}`;
                  return ({
                    ...field,
                    name: fieldName,
                    defaultValue: defaultValue?.[field.name],
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
  defaultValue: null,
  collapsibleStates: [],
  singularLabel: '',
  useHeadingPill: false,
};

DraggableSection.propTypes = {
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  rowIndex: PropTypes.number.isRequired,
  parentName: PropTypes.string.isRequired,
  singularLabel: PropTypes.string,
  renderFields: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  rowCount: PropTypes.number,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape({})]),
  dispatchCollapsibleStates: PropTypes.func.isRequired,
  collapsibleStates: PropTypes.arrayOf(PropTypes.bool),
  useHeadingPill: PropTypes.bool,
};

export default DraggableSection;

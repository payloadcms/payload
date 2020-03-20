import React from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import RenderFields from '../../../RenderFields';
import IconButton from '../../../../controls/IconButton';

import './index.scss';

const baseClass = 'repeater-row';

const RepeaterRow = ({
  addRow, removeRow, rowIndex, parentName, fields, defaultValue, dispatchCollapsibleStates, collapsibleStates,
}) => {
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
              />

              <div className={`${baseClass}__header__row-index`}>
                {`${rowIndex + 1 > 9 ? rowIndex + 1 : `0${rowIndex + 1}`}`}
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

                <IconButton
                  className={`${baseClass}__collapse__icon ${baseClass}__collapse__icon--${collapsibleStates[rowIndex] ? 'open' : 'closed'}`}
                  iconName="arrow"
                  onClick={handleCollapseClick}
                  size="small"
                />
              </div>
            </div>

            <AnimateHeight
              className={`${baseClass}__content`}
              height={collapsibleStates[rowIndex] ? 'auto' : 0}
              duration={0}
            >
              <RenderFields
                key={rowIndex}
                fields={fields.map((field) => {
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

RepeaterRow.defaultProps = {
  rowCount: null,
  defaultValue: null,
  collapsibleStates: [],
};

RepeaterRow.propTypes = {
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  rowIndex: PropTypes.number.isRequired,
  parentName: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  fieldState: PropTypes.shape({}).isRequired,
  rowCount: PropTypes.number,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape({})]),
  dispatchCollapsibleStates: PropTypes.func.isRequired,
  collapsibleStates: PropTypes.arrayOf(PropTypes.bool),
};

export default RepeaterRow;

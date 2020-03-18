import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import RenderFields from '../../../RenderFields';
import IconButton from '../../../../controls/IconButton';
import Pill from '../../../../modules/Pill';

import './index.scss';

const baseClass = 'repeater-row';

const RepeaterRow = ({
  addRow, removeRow, rowIndex, parentName, fields, fieldState,
}) => {
  const [isRowOpen, setIsRowOpen] = useState(true);

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
              <Pill>
                {parentName}
              </Pill>
              <h4 className={`${baseClass}__header__heading`}>Title Goes Here</h4>

              <div className={`${baseClass}__header__drag-handle__wrap`}>
                <div
                  {...providedDrag.dragHandleProps}
                  className={`${baseClass}__header__drag-handle`}
                  tabIndex={0}
                  role="button"
                />
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
                  className={`${baseClass}__collapse__icon ${baseClass}__collapse__icon--${isRowOpen ? 'open' : 'closed'}`}
                  iconName="arrow"
                  onClick={() => setIsRowOpen(state => !state)}
                  size="small"
                />
              </div>
            </div>

            <AnimateHeight
              className={`${baseClass}__content`}
              height={isRowOpen ? 'auto' : 0}
              duration={150}
            >
              <RenderFields
                key={rowIndex}
                fields={fields.map((field) => {
                  const fieldName = `${parentName}.${rowIndex}.${field.name}`;
                  return ({
                    ...field,
                    name: fieldName,
                    defaultValue: fieldState?.[fieldName]?.value,
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

RepeaterRow.propTypes = {
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  rowIndex: PropTypes.number.isRequired,
  parentName: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  fieldState: PropTypes.shape({}).isRequired,
};

export default RepeaterRow;

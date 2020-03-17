import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

import RenderFields from '../../../RenderFields';
import IconButton from '../../../../controls/IconButton';
import Pill from '../../../../modules/Pill';

import './index.scss';

const baseClass = 'repeater-section';

const RepeaterSection = ({
  addRow, removeRow, rowIndex, parentName, fields, fieldState, forceContentCollapse,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  useEffect(() => {
    if (forceContentCollapse) setIsSectionOpen(false);
  }, [forceContentCollapse]);

  return (
    <Draggable
      draggableId={`row-${rowIndex}`}
      index={rowIndex}
    >
      {(providedDrag, snapshot) => (
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

            <div className={`${baseClass}__header__controls`}>

              <IconButton
                {...providedDrag.dragHandleProps}
                iconName="crosshair"
                onClick={addRow}
                size="small"
              />

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
                className={`${baseClass}__collapse__icon ${baseClass}__collapse__icon--${isSectionOpen ? 'open' : 'closed'}`}
                iconName="arrow"
                onClick={() => setIsSectionOpen(state => !state)}
                size="small"
              />
            </div>
          </div>

          <AnimateHeight
            className={`${baseClass}__content`}
            height={isSectionOpen ? 'auto' : 0}
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

      )}
    </Draggable>
  );
};

RepeaterSection.defaultProps = {
  forceContentCollapse: false,
};

RepeaterSection.propTypes = {
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  rowIndex: PropTypes.number.isRequired,
  parentName: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  fieldState: PropTypes.shape({}).isRequired,
  forceContentCollapse: PropTypes.bool,
};

export default RepeaterSection;

import React from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { Draggable } from 'react-beautiful-dnd';

// eslint-disable-next-line import/no-cycle
import RenderFields from '../../../RenderFields';
import IconButton from '../../../../controls/IconButton';

import './index.scss';

const baseClass = 'flexible-row';

const FlexibleRow = (props) => {
  const {
    addRow,
    removeRow,
    rowIndex,
    parentName,
    block,
    defaultValue,
    dispatchCollapsibleStates,
    collapsibleStates,
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
              />

              <div className={`${baseClass}__header__row-index`}>
                {`${block.labels.singular} ${rowIndex + 1 > 9 ? rowIndex + 1 : `0${rowIndex + 1}`}`}
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
                fields={block.fields.map((field) => {
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

FlexibleRow.defaultProps = {
  defaultValue: null,
  collapsibleStates: [],
};

FlexibleRow.propTypes = {
  block: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
    fields: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    slug: PropTypes.string,
  }).isRequired,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  rowIndex: PropTypes.number.isRequired,
  parentName: PropTypes.string.isRequired,
  fieldState: PropTypes.shape({}).isRequired,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape({})]),
  dispatchCollapsibleStates: PropTypes.func.isRequired,
  collapsibleStates: PropTypes.arrayOf(PropTypes.bool),
};

export default FlexibleRow;

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
    dispatchRows,
    rows,
  } = props;

  const handleCollapseClick = () => {
    dispatchRows({
      type: 'UPDATE_IS_ROW_OPEN',
      rowIndex,
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
                  className={`${baseClass}__collapse__icon ${baseClass}__collapse__icon--${rows[rowIndex].isOpen ? 'open' : 'closed'}`}
                  iconName="arrow"
                  onClick={handleCollapseClick}
                  size="small"
                />
              </div>
            </div>

            <AnimateHeight
              className={`${baseClass}__content`}
              height={rows[rowIndex].isOpen ? 'auto' : 0}
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
  rows: [],
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
  dispatchRows: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    isOpen: PropTypes.bool,
    blockType: PropTypes.string,
  })),
};

export default FlexibleRow;

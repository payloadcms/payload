import React, {
  useContext, useState, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import RepeaterRow from './RepeaterRow'; // eslint-disable-line import/no-cycle

const baseClass = 'field-repeater';

const MemoizedSection = React.memo((props) => {
  const {
    label, rowCount, addRow, shouldCalcContentHeight, removeRow, fieldState, name, fields, useAddRowButton,
  } = props;

  return (
    <Section
      heading={label}
      className="repeater"
      rowCount={rowCount}
      addRow={() => addRow(0)}
      shouldCalcContentHeight={shouldCalcContentHeight}
      useAddRowButton={useAddRowButton}
    >
      {rowCount !== 0
        && (Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
          return (
            <RepeaterRow
              key={rowIndex}
              addRow={() => addRow(rowIndex)}
              removeRow={() => removeRow(rowIndex)}
              rowIndex={rowIndex}
              fieldState={fieldState}
              fields={fields}
              parentName={name}
            />
          );
        }))
      }
    </Section>
  );
});

const Repeater = (props) => {
  const [rowCount, setRowCount] = useState(0);
  const formContext = useContext(FormContext);
  const { fields: fieldState, dispatchFields } = formContext;
  const [shouldCalcContentHeight, setShouldCalcContentHeight] = useState(false);

  const {
    label,
    name,
    fields,
    defaultValue,
  } = props;

  const addRow = (rowIndex) => {
    dispatchFields({
      type: 'ADD_ROW', rowIndex, name, fields,
    });

    setRowCount(rowCount + 1);
  };

  const removeRow = (rowIndex) => {
    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, name, fields,
    });

    setRowCount(rowCount - 1);
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    dispatchFields({
      type: 'MOVE_ROW', moveFromIndex, moveToIndex, name,
    });
  };

  useEffect(() => {
    setRowCount(defaultValue.length);
  }, [defaultValue]);

  const onBeforeCapture = (result) => {
    setShouldCalcContentHeight(true);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setShouldCalcContentHeight(false);

    moveRow(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onBeforeCapture={onBeforeCapture}
    >
      <div className={baseClass}>
        <Droppable droppableId="repeater-drop">
          {(provided) => {
            return (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <MemoizedSection
                  label={label}
                  rowCount={rowCount}
                  useAddRowButton
                  addRow={addRow}
                  removeRow={removeRow}
                  shouldCalcContentHeight={shouldCalcContentHeight}
                  fieldState={fieldState}
                  name={name}
                  fields={fields}
                />
              </div>
            );
          }}
        </Droppable>
      </div>
    </DragDropContext>
  );
};

Repeater.defaultProps = {
  label: '',
  defaultValue: [],
};

Repeater.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
};

export default Repeater;

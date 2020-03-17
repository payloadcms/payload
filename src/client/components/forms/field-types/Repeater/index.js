import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import RepeaterSection from './RepeaterSection'; // eslint-disable-line import/no-cycle

import './index.scss';

const baseClass = 'field-repeater';

const Repeater = (props) => {
  const [rowCount, setRowCount] = useState(0);
  const formContext = useContext(FormContext);
  const { fields: fieldState, dispatchFields } = formContext;
  const [forceContentCollapse, setForceContentCollapse] = useState(false);

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

  const moveRow = (rowIndex, moveToIndex) => {
    dispatchFields({
      type: 'MOVE_ROW', rowIndex, moveToIndex, name,
    });
  };

  useEffect(() => {
    setRowCount(defaultValue.length);
  }, [defaultValue]);

  function onBeforeCapture(result) {
    setForceContentCollapse(true);
  }

  function onDragEnd(result) {
    if (!result.destination) {
      return;
    }

    const moveFromIndex = result.source.index;
    const moveToIndex = result.destination.index;
    dispatchFields({
      type: 'MOVE_ROW', moveFromIndex, moveToIndex, name,
    });
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onBeforeCapture={onBeforeCapture}
    >
      <div className={baseClass}>
        <Section
          heading={label}
          className="repeater"
          rowCount={rowCount}
          addInitialRow={() => addRow(0)}
        >
          {rowCount !== 0
            && (
              <Droppable droppableId="repeater-drop">
                {(provided) => {
                  return Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
                    return (
                      <div
                        ref={provided.innerRef}
                        className={`${baseClass}__row`}
                        {...provided.droppableProps}
                      >
                        <RepeaterSection
                          key={rowIndex}
                          addRow={() => addRow(rowIndex)}
                          removeRow={() => removeRow(rowIndex)}
                          moveRow={() => moveRow(rowIndex)}
                          rowIndex={rowIndex}
                          fieldState={fieldState}
                          fields={fields}
                          parentName={name}
                          forceContentCollapse={forceContentCollapse}
                        />
                      </div>
                    );
                  });
                }}
              </Droppable>
            )}
        </Section>
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

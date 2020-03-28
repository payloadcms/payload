import React, {
  useContext, useEffect, useReducer, useState, Fragment,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { ModalContext } from '@trbl/react-modal';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import AddRowModal from './AddRowModal';
import collapsibleReducer from './reducer';
import DraggableSection from '../../DraggableSection'; // eslint-disable-line import/no-cycle

import './index.scss';

const baseClass = 'field-type flexible';

const Flexible = (props) => {
  const {
    label,
    name,
    blocks,
    defaultValue,
  } = props;

  const { toggle: toggleModal, closeAll: closeAllModals } = useContext(ModalContext);
  const [rowIndexBeingAdded, setRowIndexBeingAdded] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [collapsibleStates, dispatchCollapsibleStates] = useReducer(collapsibleReducer, []);
  const formContext = useContext(FormContext);
  const modalSlug = `flexible-${name}`;

  const { fields: fieldState, dispatchFields } = formContext;

  const addRow = (rowIndex, blockType) => {
    const blockToAdd = blocks.find(block => block.slug === blockType);

    dispatchFields({
      type: 'ADD_ROW', rowIndex, name, fields: blockToAdd.fields, blockType,
    });

    dispatchCollapsibleStates({
      type: 'ADD_COLLAPSIBLE', collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount + 1);
  };

  const removeRow = (rowIndex) => {
    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, name,
    });

    dispatchCollapsibleStates({
      type: 'REMOVE_COLLAPSIBLE',
      collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount - 1);
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    dispatchFields({
      type: 'MOVE_ROW', moveFromIndex, moveToIndex, name,
    });

    dispatchCollapsibleStates({
      type: 'MOVE_COLLAPSIBLE', collapsibleIndex: moveFromIndex, moveToIndex,
    });
  };

  useEffect(() => {
    setRowCount(defaultValue.length);

    dispatchCollapsibleStates({
      type: 'SET_ALL_COLLAPSIBLES',
      payload: Array.from(Array(defaultValue.length).keys()).reduce(acc => ([...acc, true]), []), // sets all collapsibles to open on first load
    });
  }, [defaultValue]);

  const openAddRowModal = (rowIndex) => {
    setRowIndexBeingAdded(rowIndex);
    toggleModal(modalSlug);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  };

  return (
    <Fragment>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={baseClass}>
          <Section
            heading={label}
            className="flexible"
            rowCount={rowCount}
            addRow={() => openAddRowModal(0)}
            useAddRowButton
          >
            <Droppable droppableId="flexible-drop">
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {rowCount !== 0
                    && Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
                      const blockType = fieldState[`${name}.${rowIndex}.blockType`];
                      const blockToRender = blocks.find(block => block.slug === blockType.value);

                      return (
                        <DraggableSection
                          key={rowIndex}
                          parentName={name}
                          addRow={() => openAddRowModal(rowIndex)}
                          removeRow={() => removeRow(rowIndex)}
                          rowIndex={rowIndex}
                          fieldState={fieldState}
                          renderFields={blockToRender.fields}
                          defaultValue={defaultValue[rowIndex]}
                          dispatchCollapsibleStates={dispatchCollapsibleStates}
                          collapsibleStates={collapsibleStates}
                        />
                      );
                    })
                  }
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Section>
        </div>
      </DragDropContext>
      <AddRowModal
        closeAllModals={closeAllModals}
        addRow={addRow}
        rowIndexBeingAdded={rowIndexBeingAdded}
        slug={modalSlug}
        blocks={blocks}
      />
    </Fragment>
  );
};

Flexible.defaultProps = {
  label: '',
  defaultValue: [],
};

Flexible.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
};

export default Flexible;

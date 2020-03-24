import React, {
  useContext, useEffect, useReducer, useState, Fragment,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { ModalContext } from '@trbl/react-modal';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import FlexibleRow from './FlexibleRow'; // eslint-disable-line import/no-cycle
import AddRowModal from './AddRowModal';
import rowReducer from './reducer';

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
  const [rows, dispatchRows] = useReducer(rowReducer, []);
  const formContext = useContext(FormContext);
  const rowCount = rows.length;
  const modalSlug = `flexible-${name}`;

  const { fields: fieldState, dispatchFields } = formContext;

  const addRow = (rowIndex, blockType) => {
    const blockToAdd = blocks.find(block => block.slug === blockType);

    dispatchFields({
      type: 'ADD_ROW', rowIndex, name, fields: blockToAdd.fields,
    });

    dispatchRows({
      type: 'ADD', rowIndex, blockType,
    });
  };

  const removeRow = (rowIndex) => {
    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, name,
    });

    dispatchRows({
      type: 'REMOVE',
      rowIndex,
    });
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    dispatchRows({
      type: 'MOVE', rowIndex: moveFromIndex, moveToIndex,
    });

    dispatchFields({
      type: 'MOVE_ROW', moveFromIndex, moveToIndex, name,
    });
  };

  useEffect(() => {
    if (defaultValue) {
      dispatchRows({
        type: 'LOAD_ROWS',
        payload: defaultValue,
      });
    }
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
                    && rows.map((row, rowIndex) => {
                      const blockToRender = blocks.find(block => block.slug === row.blockType);

                      return (
                        <FlexibleRow
                          key={rowIndex}
                          parentName={name}
                          addRow={() => openAddRowModal(rowIndex)}
                          removeRow={() => removeRow(rowIndex)}
                          rowIndex={rowIndex}
                          fieldState={fieldState}
                          block={blockToRender}
                          defaultValue={defaultValue[rowIndex]}
                          dispatchRows={dispatchRows}
                          rows={rows}
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

import React, {
  useContext, useEffect, useReducer, useState,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useModal } from '@trbl/react-modal';

import { RowModifiedProvider, useRowModified } from '../../Form/RowModified';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import FormContext from '../../Form/Context';
import AddRowModal from './AddRowModal';
import collapsibleReducer from './reducer';
import DraggableSection from '../../DraggableSection';

import './index.scss';

const baseClass = 'field-type flexible';

const Flexible = (props) => {
  const {
    label,
    name,
    blocks,
    defaultValue,
    singularLabel,
    fieldTypes,
  } = props;

  const parentRowsModified = useRowModified();
  const { toggle: toggleModal, closeAll: closeAllModals } = useModal();
  const [rowIndexBeingAdded, setRowIndexBeingAdded] = useState(null);
  const [lastModified, setLastModified] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [collapsibleStates, dispatchCollapsibleStates] = useReducer(collapsibleReducer, []);
  const formContext = useContext(FormContext);
  const modalSlug = `flexible-${name}`;

  const { fields: fieldState, dispatchFields, countRows } = formContext;

  const addRow = (rowIndex, blockType) => {
    const blockToAdd = blocks.find(block => block.slug === blockType);

    dispatchFields({
      type: 'ADD_ROW', rowIndex, name, fieldSchema: blockToAdd.fields, blockType,
    });

    dispatchCollapsibleStates({
      type: 'ADD_COLLAPSIBLE', collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount + 1);
    setLastModified(Date.now());
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
    setLastModified(Date.now());
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    dispatchFields({
      type: 'MOVE_ROW', moveFromIndex, moveToIndex, name,
    });

    dispatchCollapsibleStates({
      type: 'MOVE_COLLAPSIBLE', collapsibleIndex: moveFromIndex, moveToIndex,
    });

    setLastModified(Date.now());
  };

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

  const updateRowCountOnParentRowModified = () => {
    const countedRows = countRows(name);
    setRowCount(countedRows);
  };

  useEffect(updateRowCountOnParentRowModified, [parentRowsModified]);

  useEffect(() => {
    setRowCount(defaultValue.length);
    setLastModified(null);

    dispatchCollapsibleStates({
      type: 'SET_ALL_COLLAPSIBLES',
      payload: Array.from(Array(defaultValue.length).keys()).reduce(acc => ([...acc, true]), []), // sets all collapsibles to open on first load
    });
  }, [defaultValue]);

  return (
    <RowModifiedProvider lastModified={lastModified}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={baseClass}>
          <Droppable droppableId="flexible-drop">
            {provided => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {rowCount !== 0 && Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
                  let blockType = fieldState[`${name}.${rowIndex}.blockType`]?.value;

                  if (!lastModified && !blockType) {
                    blockType = defaultValue?.[rowIndex]?.blockType;
                  }

                  const blockToRender = blocks.find(block => block.slug === blockType);

                  if (blockToRender) {
                    return (
                      <DraggableSection
                        fieldTypes={fieldTypes}
                        key={rowIndex}
                        parentName={name}
                        addRow={() => openAddRowModal(rowIndex)}
                        removeRow={() => removeRow(rowIndex)}
                        rowIndex={rowIndex}
                        fieldState={fieldState}
                        fieldSchema={[
                          ...blockToRender.fields,
                          {
                            name: 'blockType',
                            type: 'text',
                            hidden: {
                              admin: true,
                            },
                          }, {
                            name: 'blockName',
                            type: 'text',
                            hidden: {
                              admin: true,
                            },
                          },
                        ]}
                        singularLabel={blockType}
                        defaultValue={lastModified ? undefined : defaultValue[rowIndex]}
                        dispatchCollapsibleStates={dispatchCollapsibleStates}
                        collapsibleStates={collapsibleStates}
                        blockType="flexible"
                      />
                    );
                  }

                  return null;
                })
                }
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className={`${baseClass}__add-button-wrap`}>
            <Button
              onClick={() => openAddRowModal(rowCount)}
              type="secondary"
            >
              {`Add ${singularLabel}`}
            </Button>
          </div>
        </div>
      </DragDropContext>
      <AddRowModal
        closeAllModals={closeAllModals}
        addRow={addRow}
        rowIndexBeingAdded={rowIndexBeingAdded}
        slug={modalSlug}
        blocks={blocks}
      />
    </RowModifiedProvider>
  );
};

Flexible.defaultProps = {
  label: '',
  defaultValue: [],
  singularLabel: 'Block',
};

Flexible.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  singularLabel: PropTypes.string,
  name: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
};

export default withCondition(Flexible);

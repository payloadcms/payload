import React, {
  useContext, useEffect, useReducer, useState, useCallback,
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
import { useRenderedFields } from '../../RenderFields';
import Error from '../../Error';
import useFieldType from '../../useFieldType';
import { flexible } from '../../../../../fields/validations';

import './index.scss';

const baseClass = 'field-type flexible';

const Flexible = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    blocks,
    defaultValue,
    initialData,
    singularLabel,
    fieldTypes,
    maxRows,
    minRows,
    required,
    validate,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { minRows, maxRows });
    return validationResult;
  }, [validate, maxRows, minRows]);

  const {
    showError,
    errorMessage,
    setValue,
    value,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    disableFormData: true,
    initialData,
    defaultValue,
    required,
  });

  const parentRowsModified = useRowModified();
  const { toggle: toggleModal, closeAll: closeAllModals } = useModal();
  const [rowIndexBeingAdded, setRowIndexBeingAdded] = useState(null);
  const [lastModified, setLastModified] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [collapsibleStates, dispatchCollapsibleStates] = useReducer(collapsibleReducer, []);
  const formContext = useContext(FormContext);
  const modalSlug = `flexible-${path}`;
  const { customComponentsPath } = useRenderedFields();

  const { dispatchFields, countRows, getFields } = formContext;
  const fieldState = getFields();
  const dataToInitialize = initialData || defaultValue;

  const addRow = (rowIndex, blockType) => {
    const blockToAdd = blocks.find(block => block.slug === blockType);

    dispatchFields({
      type: 'ADD_ROW', rowIndex, path, fieldSchema: blockToAdd.fields, blockType,
    });

    dispatchCollapsibleStates({
      type: 'ADD_COLLAPSIBLE', collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount + 1);
    setLastModified(Date.now());
  };

  const removeRow = (rowIndex) => {
    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, path,
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
      type: 'MOVE_ROW', moveFromIndex, moveToIndex, path,
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
    const countedRows = countRows(path);
    setRowCount(countedRows);
  };

  useEffect(updateRowCountOnParentRowModified, [parentRowsModified]);

  useEffect(() => {
    setRowCount(dataToInitialize.length);
    setLastModified(null);

    dispatchCollapsibleStates({
      type: 'SET_ALL_COLLAPSIBLES',
      payload: Array.from(Array(dataToInitialize.length).keys()).reduce(acc => ([...acc, true]), []), // sets all collapsibles to open on first load
    });
  }, [dataToInitialize]);

  useEffect(() => {
    let i;
    const newValue = [];
    for (i = 0; i < rowCount; i += 1) {
      newValue.push({});
    }

    setValue(newValue);
  }, [rowCount, setValue]);

  return (
    <RowModifiedProvider lastModified={lastModified}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={baseClass}>
          <header className={`${baseClass}__header`}>
            <h3>{label}</h3>
            <Error
              showError={showError}
              message={errorMessage}
            />
          </header>
          <Droppable droppableId="flexible-drop">
            {provided => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {rowCount !== 0 && Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
                  let blockType = fieldState[`${path}.${rowIndex}.blockType`]?.value;

                  if (!lastModified && !blockType) {
                    blockType = dataToInitialize?.[rowIndex]?.blockType;
                  }

                  const blockToRender = blocks.find(block => block.slug === blockType);

                  if (blockToRender) {
                    return (
                      <DraggableSection
                        fieldTypes={fieldTypes}
                        key={rowIndex}
                        parentPath={path}
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
                        initialData={lastModified ? undefined : value[rowIndex]}
                        dispatchCollapsibleStates={dispatchCollapsibleStates}
                        collapsibleStates={collapsibleStates}
                        blockType="flexible"
                        customComponentsPath={`${customComponentsPath}${name}.fields.`}
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
              buttonStyle="secondary"
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
  initialData: [],
  singularLabel: 'Block',
  validate: flexible,
  required: false,
  maxRows: undefined,
  minRows: undefined,
};

Flexible.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  initialData: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  singularLabel: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  validate: PropTypes.func,
  required: PropTypes.bool,
  maxRows: PropTypes.number,
  minRows: PropTypes.number,
};

export default withCondition(Flexible);

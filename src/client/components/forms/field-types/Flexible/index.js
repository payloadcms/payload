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
import collapsibleReducer from './reducer';
import DraggableSection from '../../DraggableSection';
import { useRenderedFields } from '../../RenderFields';
import { useLocale } from '../../../utilities/Locale';
import { flexible } from '../../../../../validation/validations';
import Error from '../../Error';
import useFieldType from '../../useFieldType';
import Popup from '../../../elements/Popup';
import BlocksContainer from './BlockSelector/BlocksContainer';

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
    const validationResult = validate(
      value,
      {
        minRows, maxRows, singularLabel, blocks, required,
      },
    );
    return validationResult;
  }, [validate, maxRows, minRows, singularLabel, blocks, required]);

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    disableFormData: true,
    initialData: initialData?.length,
    defaultValue: defaultValue?.length,
    required,
  });

  const dataToInitialize = initialData || defaultValue;
  const parentRowsModified = useRowModified();
  const [addRowIndex, setAddRowIndex] = useState(null);
  const [lastModified, setLastModified] = useState(null);
  const [rowCount, setRowCount] = useState(dataToInitialize?.length || 0);
  const [collapsibleStates, dispatchCollapsibleStates] = useReducer(collapsibleReducer, []);
  const formContext = useContext(FormContext);
  const { customComponentsPath } = useRenderedFields();
  const locale = useLocale();

  const { dispatchFields, countRows, getFields } = formContext;
  const fieldState = getFields();

  const addRow = (rowIndex, blockType) => {
    const blockToAdd = blocks.find(block => block.slug === blockType);
    setAddRowIndex(current => current + 1);

    dispatchFields({
      type: 'ADD_ROW', rowIndex, path, fieldSchema: blockToAdd.fields, blockType,
    });

    dispatchCollapsibleStates({
      type: 'ADD_COLLAPSIBLE', collapsibleIndex: rowIndex,
    });

    setValue(value + 1);
    setRowCount(rowCount + 1);
    setLastModified(Date.now());
  };

  const removeRow = (rowIndex) => {
    setAddRowIndex(current => current - 1);

    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, path,
    });

    dispatchCollapsibleStates({
      type: 'REMOVE_COLLAPSIBLE',
      collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount - 1);
    setLastModified(Date.now());
    setValue(value - 1);
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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  };

  useEffect(() => {
    const countedRows = countRows(path);
    setRowCount(countedRows);
  }, [countRows, path, parentRowsModified]);

  useEffect(() => {
    setRowCount(dataToInitialize.length);
    setLastModified(null);

    dispatchCollapsibleStates({
      type: 'SET_ALL_COLLAPSIBLES',
      payload: Array.from(Array(dataToInitialize.length).keys()).reduce(acc => ([...acc, true]), []), // sets all collapsibles to open on first load
    });
  }, [dataToInitialize]);

  useEffect(() => {
    setLastModified(null);
  }, [locale]);

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
                        blockType="flexible"
                        fieldTypes={fieldTypes}
                        key={rowIndex}
                        parentPath={path}
                        moveRow={moveRow}
                        addRow={() => addRow(rowIndex, blockType)}
                        removeRow={() => removeRow(rowIndex)}
                        rowIndex={rowIndex}
                        fieldState={fieldState}
                        fieldSchema={[
                          ...blockToRender.fields,
                          {
                            name: 'blockType',
                            type: 'text',
                            hidden: 'admin',
                          }, {
                            name: 'blockName',
                            type: 'text',
                            hidden: 'admin',
                          },
                        ]}
                        singularLabel={blockToRender?.labels?.singular}
                        initialData={lastModified ? undefined : dataToInitialize?.[rowIndex]}
                        dispatchCollapsibleStates={dispatchCollapsibleStates}
                        collapsibleStates={collapsibleStates}
                        customComponentsPath={`${customComponentsPath}${name}.fields.`}
                        positionHandleVerticalAlignment="top"
                        actionHandleVerticalAlignment="top"
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
            <Popup
              buttonType="custom"
              button={(
                <Button
                  buttonStyle="icon-label"
                  icon="plus"
                  iconPosition="left"
                  iconStyle="with-border"
                >
                  {`Add ${singularLabel}`}
                </Button>
              )}
            >
              <BlocksContainer
                blocks={blocks}
                addRow={addRow}
                addRowIndex={addRowIndex}
              />
            </Popup>
          </div>
        </div>
      </DragDropContext>
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

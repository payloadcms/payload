import React, {
  useContext, useState, useEffect, useReducer, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import { RowModifiedProvider, useRowModified } from '../../Form/RowModified';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import FormContext from '../../Form/Context';
import DraggableSection from '../../DraggableSection';
import collapsibleReducer from './reducer';
import { useRenderedFields } from '../../RenderFields';
import useFieldType from '../../useFieldType';
import { useLocale } from '../../../utilities/Locale';
import Error from '../../Error';
import { repeater } from '../../../../../validation/validations';

import './index.scss';

const baseClass = 'field-type repeater';

const Repeater = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    fields,
    defaultValue,
    initialData,
    singularLabel,
    fieldTypes,
    validate,
    required,
    maxRows,
    minRows,
  } = props;

  const dataToInitialize = initialData || defaultValue;
  const parentRowsModified = useRowModified();
  const [collapsibleStates, dispatchCollapsibleStates] = useReducer(collapsibleReducer, []);
  const formContext = useContext(FormContext);
  const [rowCount, setRowCount] = useState(dataToInitialize?.length || 0);
  const [lastModified, setLastModified] = useState(null);
  const { getFields, dispatchFields, countRows } = formContext;
  const { customComponentsPath } = useRenderedFields();
  const locale = useLocale();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { minRows, maxRows, required });
    return validationResult;
  }, [validate, maxRows, minRows, required]);

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

  const fieldState = getFields();

  const addRow = (rowIndex) => {
    dispatchFields({
      type: 'ADD_ROW', rowIndex, path, fieldSchema: fields,
    });

    dispatchCollapsibleStates({
      type: 'ADD_COLLAPSIBLE', collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount + 1);
    setLastModified(Date.now());
    setValue(value + 1);
  };

  const removeRow = (rowIndex) => {
    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, path, fields,
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
    setRowCount(dataToInitialize.length);
    setLastModified(null);

    dispatchCollapsibleStates({
      type: 'SET_ALL_COLLAPSIBLES',
      payload: Array.from(Array(dataToInitialize.length).keys()).reduce(acc => ([...acc, true]), []), // sets all collapsibles to open on first load
    });
  }, [dataToInitialize]);

  useEffect(() => {
    const countedRows = countRows(path);
    setRowCount(countedRows);
  }, [countRows, path, parentRowsModified]);

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
          <Droppable droppableId="repeater-drop">
            {provided => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {rowCount !== 0
                  && Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
                    return (
                      <DraggableSection
                        fieldTypes={fieldTypes}
                        key={rowIndex}
                        parentPath={path}
                        singularLabel={singularLabel}
                        moveRow={moveRow}
                        addRow={() => addRow(rowIndex)}
                        removeRow={() => removeRow(rowIndex)}
                        rowIndex={rowIndex}
                        fieldState={fieldState}
                        fieldSchema={fields}
                        initialData={lastModified ? undefined : dataToInitialize?.[rowIndex]}
                        dispatchCollapsibleStates={dispatchCollapsibleStates}
                        collapsibleStates={collapsibleStates}
                        customComponentsPath={`${customComponentsPath}${name}.fields.`}
                        positionHandleVerticalAlignment="sticky"
                        actionHandleVerticalAlignment="sticky"
                      />
                    );
                  })
                }
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className={`${baseClass}__add-button-wrap`}>
            <Button
              buttonStyle="icon-label"
              icon="plus"
              iconStyle="with-border"
              iconPosition="left"
              onClick={() => addRow(rowCount)}
            >
              {`Add ${singularLabel}`}
            </Button>
          </div>
        </div>
      </DragDropContext>
    </RowModifiedProvider>
  );
};

Repeater.defaultProps = {
  label: '',
  singularLabel: 'Row',
  defaultValue: [],
  initialData: [],
  validate: repeater,
  required: false,
  maxRows: undefined,
  minRows: undefined,
};

Repeater.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  initialData: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  fields: PropTypes.arrayOf(
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

export default withCondition(Repeater);

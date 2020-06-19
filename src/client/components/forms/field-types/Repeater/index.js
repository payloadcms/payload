import React, { useEffect, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import DraggableSection from '../../DraggableSection';
import reducer from '../rowReducer';
import { useRenderedFields } from '../../RenderFields';
import useForm from '../../Form/useForm';
import useFieldType from '../../useFieldType';
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
  const [rows, dispatchRows] = useReducer(reducer, []);
  const { customComponentsPath } = useRenderedFields();
  const { getDataByPath } = useForm();

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

  const addRow = (rowIndex) => {
    const data = getDataByPath(path)?.[name];

    dispatchRows({
      type: 'ADD', index: rowIndex, data,
    });

    setValue(value + 1);
  };

  const removeRow = (rowIndex) => {
    const data = getDataByPath(path)?.[name];

    dispatchRows({
      type: 'REMOVE',
      index: rowIndex,
      data,
    });

    setValue(value - 1);
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    const data = getDataByPath(path)?.[name];

    dispatchRows({
      type: 'MOVE', index: moveFromIndex, moveToIndex, data,
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  };

  useEffect(() => {
    dispatchRows({
      type: 'SET_ALL',
      rows: dataToInitialize.reduce((acc, data) => ([
        ...acc,
        {
          key: uuidv4(),
          open: true,
          data,
        },
      ]), []),
    });
  }, [dataToInitialize]);

  return (
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
              {rows.length > 0 && rows.map((row, i) => {
                return (
                  <DraggableSection
                    isOpen={row.open}
                    fieldTypes={fieldTypes}
                    key={row.key}
                    id={row.key}
                    parentPath={path}
                    singularLabel={singularLabel}
                    addRow={() => addRow(i)}
                    removeRow={() => removeRow(i)}
                    rowIndex={i}
                    fieldSchema={fields}
                    initialData={row.data}
                    dispatchRows={dispatchRows}
                    customComponentsPath={`${customComponentsPath}${name}.fields.`}
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
            onClick={() => addRow(value)}
            buttonStyle="secondary"
          >
            {`Add ${singularLabel}`}
          </Button>
        </div>
      </div>
    </DragDropContext>
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

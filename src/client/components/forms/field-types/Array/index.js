import React, { useEffect, useReducer, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import DraggableSection from '../../DraggableSection';
import reducer from '../rowReducer';
import { useRenderedFields } from '../../RenderFields';
import { useForm } from '../../Form/context';
import useFieldType from '../../useFieldType';
import Error from '../../Error';
import { array } from '../../../../../fields/validations';

import './index.scss';

const baseClass = 'field-type array';

const ArrayFieldType = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    fields,
    defaultValue,
    initialData,
    fieldTypes,
    validate,
    required,
    maxRows,
    minRows,
    singularLabel,
    permissions,
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

  const [disableFormData, setDisableFormData] = useState(false);

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    disableFormData,
    initialData: initialData?.length,
    defaultValue: defaultValue?.length,
    required,
  });

  const addRow = (rowIndex) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'ADD', index: rowIndex, data,
    });

    setValue(value + 1);
  };

  const removeRow = (rowIndex) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'REMOVE',
      index: rowIndex,
      data,
    });

    setValue(value - 1);
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    const data = getDataByPath(path);

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

  useEffect(() => {
    if (value === 0 && dataToInitialize.length > 0 && disableFormData) {
      setDisableFormData(false);
      setValue(value);
    } else if (value > 0 && !disableFormData) {
      setDisableFormData(true);
      setValue(value);
    }
  }, [value, setValue, disableFormData, dataToInitialize]);

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
        <Droppable droppableId="array-drop">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {rows.length > 0 && rows.map((row, i) => (
                <DraggableSection
                  key={row.key}
                  id={row.key}
                  blockType="array"
                  singularLabel={singularLabel}
                  isOpen={row.open}
                  rowCount={rows.length}
                  rowIndex={i}
                  addRow={() => addRow(i)}
                  removeRow={() => removeRow(i)}
                  moveRow={moveRow}
                  parentPath={path}
                  initialData={row.data}
                  initNull={row.initNull}
                  customComponentsPath={`${customComponentsPath}${name}.fields.`}
                  fieldTypes={fieldTypes}
                  fieldSchema={fields}
                  permissions={permissions.fields}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div className={`${baseClass}__add-button-wrap`}>
          <Button
            onClick={() => addRow(value)}
            buttonStyle="icon-label"
            icon="plus"
            iconStyle="with-border"
            iconPosition="left"
          >
            {`Add ${singularLabel}`}
          </Button>
        </div>
      </div>
    </DragDropContext>
  );
};

ArrayFieldType.defaultProps = {
  label: '',
  defaultValue: [],
  initialData: [],
  validate: array,
  required: false,
  maxRows: undefined,
  minRows: undefined,
  singularLabel: 'Row',
  permissions: {},
};

ArrayFieldType.propTypes = {
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
  permissions: PropTypes.shape({
    fields: PropTypes.shape({}),
  }),
};

export default withCondition(ArrayFieldType);

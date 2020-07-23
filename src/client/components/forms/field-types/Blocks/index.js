import React, {
  useEffect, useReducer, useCallback, useState,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import reducer from '../rowReducer';
import { useForm } from '../../Form/context';
import DraggableSection from '../../DraggableSection';
import { useRenderedFields } from '../../RenderFields';
import Error from '../../Error';
import useFieldType from '../../useFieldType';
import Popup from '../../../elements/Popup';
import BlockSelector from './BlockSelector';
import { blocks as blocksValidator } from '../../../../../fields/validations';

import './index.scss';

const baseClass = 'field-type blocks';

const Blocks = (props) => {
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
    permissions,
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

  const dataToInitialize = initialData || defaultValue;
  const [rows, dispatchRows] = useReducer(reducer, []);
  const { customComponentsPath } = useRenderedFields();
  const { getDataByPath } = useForm();

  const addRow = useCallback((index, blockType) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'ADD', index, data, initialRowData: { blockType },
    });

    setValue(value + 1);
  }, [getDataByPath, path, setValue, value]);

  const removeRow = useCallback((index) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'REMOVE',
      index,
      data,
    });

    setValue(value - 1);
  }, [getDataByPath, path, setValue, value]);

  const moveRow = useCallback((moveFromIndex, moveToIndex) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'MOVE', index: moveFromIndex, moveToIndex, data,
    });
  }, [getDataByPath, path]);

  const toggleCollapse = useCallback((index) => {
    dispatchRows({
      type: 'TOGGLE_COLLAPSE', index, rows,
    });
  }, [rows]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  }, [moveRow]);

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
    <RenderBlock
      onDragEnd={onDragEnd}
      label={label}
      showError={showError}
      errorMessage={errorMessage}
      rows={rows}
      singularLabel={singularLabel}
      addRow={addRow}
      removeRow={removeRow}
      moveRow={moveRow}
      path={path}
      customComponentsPath={customComponentsPath}
      name={name}
      fieldTypes={fieldTypes}
      toggleCollapse={toggleCollapse}
      permissions={permissions}
      value={value}
      dataToInitialize={dataToInitialize}
      blocks={blocks}
    />
  );
};

Blocks.defaultProps = {
  label: '',
  defaultValue: [],
  initialData: [],
  singularLabel: 'Block',
  validate: blocksValidator,
  required: false,
  maxRows: undefined,
  minRows: undefined,
  permissions: {},
};

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  initialData: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
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

const RenderBlock = React.memo((props) => {
  const {
    onDragEnd,
    label,
    showError,
    errorMessage,
    rows,
    singularLabel,
    addRow,
    removeRow,
    moveRow,
    path,
    customComponentsPath,
    name,
    fieldTypes,
    permissions,
    value,
    toggleCollapse,
    dataToInitialize,
    blocks,
  } = props;

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

        <Droppable droppableId="blocks-drop">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {rows.length > 0 && rows.map((row, i) => {
                let { blockType } = row.data;

                if (!blockType) {
                  blockType = dataToInitialize?.[i]?.blockType;
                }

                const blockToRender = blocks.find((block) => block.slug === blockType);

                if (blockToRender) {
                  return (
                    <DraggableSection
                      key={row.key}
                      id={row.key}
                      blockType="blocks"
                      blocks={blocks}
                      singularLabel={blockToRender?.labels?.singular}
                      isOpen={row.open}
                      rowCount={rows.length}
                      rowIndex={i}
                      addRow={addRow}
                      removeRow={() => removeRow(i)}
                      moveRow={moveRow}
                      toggleRowCollapse={() => toggleCollapse(i)}
                      parentPath={path}
                      initialData={row.data}
                      customComponentsPath={`${customComponentsPath}${name}.fields.`}
                      fieldTypes={fieldTypes}
                      permissions={permissions.fields}
                      fieldSchema={[
                        ...blockToRender.fields,
                        {
                          name: 'blockType',
                          type: 'text',
                          admin: {
                            hidden: true,
                          },
                        },
                      ]}
                    />
                  );
                }

                return null;
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div className={`${baseClass}__add-button-wrap`}>
          <Popup
            buttonType="custom"
            size="large"
            horizontalAlign="left"
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
            render={({ close }) => (
              <BlockSelector
                blocks={blocks}
                addRow={addRow}
                addRowIndex={value}
                close={close}
              />
            )}
          />
        </div>
      </div>
    </DragDropContext>
  );
});

export default withCondition(Blocks);

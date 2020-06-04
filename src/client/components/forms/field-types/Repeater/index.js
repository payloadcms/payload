import React, {
  useContext, useState, useEffect, useReducer,
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

import './index.scss';

const baseClass = 'field-type repeater';

const Repeater = (props) => {
  const parentRowsModified = useRowModified();
  const [collapsibleStates, dispatchCollapsibleStates] = useReducer(collapsibleReducer, []);
  const formContext = useContext(FormContext);
  const [rowCount, setRowCount] = useState(0);
  const [lastModified, setLastModified] = useState(null);
  const { getFields, dispatchFields, countRows } = formContext;
  const { customComponentsPath } = useRenderedFields();

  const fieldState = getFields();

  const {
    name,
    path: pathFromProps,
    fields,
    defaultValue,
    initialData,
    singularLabel,
    fieldTypes,
  } = props;

  const path = pathFromProps || name;
  const dataToInitialize = initialData || defaultValue;

  const addRow = (rowIndex) => {
    dispatchFields({
      type: 'ADD_ROW', rowIndex, path, fieldSchema: fields,
    });

    dispatchCollapsibleStates({
      type: 'ADD_COLLAPSIBLE', collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount + 1);
    setLastModified(Date.now());
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

  useEffect(() => {
    setRowCount(dataToInitialize.length);
    setLastModified(null);

    dispatchCollapsibleStates({
      type: 'SET_ALL_COLLAPSIBLES',
      payload: Array.from(Array(dataToInitialize.length).keys()).reduce(acc => ([...acc, true]), []), // sets all collapsibles to open on first load
    });
  }, [dataToInitialize]);

  const updateRowCountOnParentRowModified = () => {
    const countedRows = countRows(path);
    setRowCount(countedRows);
  };

  useEffect(updateRowCountOnParentRowModified, [parentRowsModified]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  };

  return (
    <RowModifiedProvider lastModified={lastModified}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={baseClass}>
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
                        addRow={() => addRow(rowIndex)}
                        removeRow={() => removeRow(rowIndex)}
                        rowIndex={rowIndex}
                        fieldState={fieldState}
                        fieldSchema={fields}
                        initialData={lastModified ? undefined : dataToInitialize[rowIndex]}
                        dispatchCollapsibleStates={dispatchCollapsibleStates}
                        collapsibleStates={collapsibleStates}
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
              onClick={() => addRow(rowCount)}
              buttonStyle="secondary"
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
};

export default withCondition(Repeater);

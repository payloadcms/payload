import React, {
  useEffect, useReducer, useCallback, useState,
} from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import { usePreferences } from '../../../utilities/Preferences';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import reducer from '../rowReducer';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { useForm } from '../../Form/context';
import buildStateFromSchema from '../../Form/buildStateFromSchema';
import DraggableSection from '../../DraggableSection';
import Error from '../../Error';
import useField from '../../useField';
import Popup from '../../../elements/Popup';
import BlockSelector from './BlockSelector';
import { blocks as blocksValidator } from '../../../../../fields/validations';
import Banner from '../../../elements/Banner';
import FieldDescription from '../../FieldDescription';
import { Props, RenderBlockProps } from './types';
import { DocumentPreferences } from '../../../../../preferences/types';

import './index.scss';

const baseClass = 'field-type blocks';

const labelDefaults = {
  singular: 'Block',
  plural: 'Blocks',
};

const Blocks: React.FC<Props> = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    blocks,
    labels = labelDefaults,
    fieldTypes,
    maxRows,
    minRows,
    required,
    validate = blocksValidator,
    permissions,
    admin: {
      readOnly,
      description,
      condition,
    },
  } = props;

  const path = pathFromProps || name;

  const { preferencesKey } = useDocumentInfo();

  const { getPreference, setPreference } = usePreferences();
  const [rows, dispatchRows] = useReducer(reducer, []);
  const formContext = useForm();
  const { dispatchFields } = formContext;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(
      value,
      {
        minRows, maxRows, labels, blocks, required,
      },
    );
    return validationResult;
  }, [validate, maxRows, minRows, labels, blocks, required]);

  const [disableFormData, setDisableFormData] = useState(false);

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useField({
    path,
    validate: memoizedValidate,
    disableFormData,
    ignoreWhileFlattening: true,
    condition,
  });

  const addRow = useCallback(async (rowIndex, blockType) => {
    const block = blocks.find((potentialBlock) => potentialBlock.slug === blockType);

    const subFieldState = await buildStateFromSchema(block.fields);

    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path, blockType });
    dispatchRows({ type: 'ADD', rowIndex, blockType });
    setValue(value as number + 1);
  }, [path, setValue, value, blocks, dispatchFields]);

  const removeRow = useCallback((rowIndex) => {
    dispatchRows({ type: 'REMOVE', rowIndex });
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
    setValue(value as number - 1);
  }, [path, setValue, value, dispatchFields]);

  const moveRow = useCallback((moveFromIndex, moveToIndex) => {
    dispatchRows({ type: 'MOVE', moveFromIndex, moveToIndex });
    dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path });
  }, [dispatchRows, dispatchFields, path]);

  const setCollapse = useCallback(async (id: string, collapsed: boolean) => {
    dispatchRows({ type: 'SET_COLLAPSE', id, collapsed });

    if (preferencesKey) {
      const preferences: DocumentPreferences = await getPreference(preferencesKey);
      const preferencesToSet = preferences || { fields: {} };
      let newCollapsedState = preferencesToSet?.fields?.[path]?.collapsed
        .filter((filterID) => (rows.find((row) => row.id === filterID)))
        || [];

      if (!collapsed) {
        newCollapsedState = newCollapsedState.filter((existingID) => existingID !== id);
      } else {
        newCollapsedState.push(id);
      }

      setPreference(preferencesKey, {
        ...preferencesToSet,
        fields: {
          ...preferencesToSet?.fields || {},
          [path]: {
            ...preferencesToSet?.fields?.[path],
            collapsed: newCollapsedState,
          },
        },
      });
    }
  }, [preferencesKey, getPreference, path, setPreference, rows]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  }, [moveRow]);

  useEffect(() => {
    const fetchPreferences = async () => {
      const preferences = preferencesKey ? await getPreference<DocumentPreferences>(preferencesKey) : undefined;
      const data = formContext.getDataByPath(path);
      dispatchRows({ type: 'SET_ALL', data: data || [], collapsedState: preferences?.fields?.[path]?.collapsed });
    };

    fetchPreferences();
  }, [formContext, path, preferencesKey, getPreference]);

  useEffect(() => {
    setValue(rows?.length || 0);

    if (rows?.length === 0) {
      setDisableFormData(false);
    } else {
      setDisableFormData(true);
    }
  }, [rows, setValue]);

  return (
    <RenderBlocks
      onDragEnd={onDragEnd}
      label={label}
      showError={showError}
      errorMessage={errorMessage}
      rows={rows}
      labels={labels}
      addRow={addRow}
      removeRow={removeRow}
      moveRow={moveRow}
      path={path}
      name={name}
      fieldTypes={fieldTypes}
      setCollapse={setCollapse}
      permissions={permissions}
      value={value as number}
      blocks={blocks}
      readOnly={readOnly}
      minRows={minRows}
      maxRows={maxRows}
      required={required}
      description={description}
    />
  );
};

const RenderBlocks = React.memo((props: RenderBlockProps) => {
  const {
    onDragEnd,
    label,
    showError,
    errorMessage,
    rows,
    labels,
    addRow,
    removeRow,
    moveRow,
    path,
    fieldTypes,
    permissions,
    value,
    setCollapse,
    blocks,
    readOnly,
    minRows,
    maxRows,
    required,
    description,
  } = props;

  const hasMaxRows = maxRows && rows.length >= maxRows;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className={baseClass}
      >
        <div className={`${baseClass}__error-wrap`}>
          <Error
            showError={showError}
            message={errorMessage}
          />
        </div>
        <header className={`${baseClass}__header`}>
          <h3>{label}</h3>
          <FieldDescription
            value={value}
            description={description}
          />
        </header>

        <Droppable
          droppableId="blocks-drop"
          isDropDisabled={readOnly}
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {rows.length > 0 && rows.map((row, i) => {
                const { blockType } = row;
                const blockToRender = blocks.find((block) => block.slug === blockType);

                if (blockToRender) {
                  return (
                    <DraggableSection
                      readOnly={readOnly}
                      key={row.id}
                      id={row.id}
                      blockType="blocks"
                      blocks={blocks}
                      label={blockToRender?.labels?.singular}
                      isCollapsed={row.collapsed}
                      rowCount={rows.length}
                      rowIndex={i}
                      addRow={addRow}
                      removeRow={removeRow}
                      moveRow={moveRow}
                      setRowCollapse={setCollapse}
                      parentPath={path}
                      fieldTypes={fieldTypes}
                      permissions={permissions}
                      hasMaxRows={hasMaxRows}
                      fieldSchema={[
                        ...blockToRender.fields,
                      ]}
                    />
                  );
                }

                return null;
              })}
              {(rows.length < minRows || (required && rows.length === 0)) && (
                <Banner type="error">
                  This field requires at least
                  {' '}
                  {`${minRows || 1} ${minRows === 1 || typeof minRows === 'undefined' ? labels.singular : labels.plural}`}
                </Banner>
              )}
              {(rows.length === 0 && readOnly) && (
                <Banner>
                  This field has no
                  {' '}
                  {labels.plural}
                  .
                </Banner>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {(!readOnly && (rows.length < maxRows || maxRows === undefined)) && (
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
                  {`Add ${labels.singular}`}
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
        )}
      </div>
    </DragDropContext>
  );
});

export default withCondition(Blocks);

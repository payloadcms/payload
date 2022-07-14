import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import { useAuth } from '../../../utilities/Auth';
import { usePreferences } from '../../../utilities/Preferences';
import { useLocale } from '../../../utilities/Locale';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import reducer, { Row } from '../rowReducer';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { useForm } from '../../Form/context';
import buildStateFromSchema from '../../Form/buildStateFromSchema';
import Error from '../../Error';
import useField from '../../useField';
import Popup from '../../../elements/Popup';
import BlockSelector from './BlockSelector';
import { blocks as blocksValidator } from '../../../../../fields/validations';
import Banner from '../../../elements/Banner';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { useOperation } from '../../../utilities/OperationProvider';
import { Collapsible } from '../../../elements/Collapsible';
import { ArrayAction } from '../../../elements/ArrayAction';
import RenderFields from '../../RenderFields';
import { fieldAffectsData } from '../../../../../fields/config/types';

import './index.scss';
import Pill from '../../../elements/Pill';

const baseClass = 'blocks-field';

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
      className,
    },
  } = props;

  const path = pathFromProps || name;

  const { preferencesKey, preferences } = useDocumentInfo();
  const { setPreference } = usePreferences();
  const [rows, dispatchRows] = useReducer(reducer, []);
  const formContext = useForm();
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const locale = useLocale();
  const operation = useOperation();
  const { dispatchFields } = formContext;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, minRows, maxRows, required });
  }, [maxRows, minRows, required, validate]);

  const [disableFormData, setDisableFormData] = useState(false);
  const [selectorIndexOpen, setSelectorIndexOpen] = useState<number>();

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useField<number>({
    path,
    validate: memoizedValidate,
    disableFormData,
    condition,
  });

  const onAddPopupToggle = useCallback((open) => {
    if (!open) {
      setSelectorIndexOpen(undefined);
    }
  }, []);

  const addRow = useCallback(async (rowIndex: number, blockType: string) => {
    const block = blocks.find((potentialBlock) => potentialBlock.slug === blockType);
    const subFieldState = await buildStateFromSchema({ fieldSchema: block.fields, operation, id, user, locale });
    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path, blockType });
    dispatchRows({ type: 'ADD', rowIndex, blockType });
    setValue(value as number + 1);

    setTimeout(() => {
      const newRow = document.getElementById(`${path}-row-${rowIndex + 1}`);

      if (newRow) {
        const bounds = newRow.getBoundingClientRect();
        window.scrollBy({
          top: bounds.top - 100,
          behavior: 'smooth',
        });
      }
    }, 0);
  }, [path, setValue, value, blocks, dispatchFields, operation, id, user, locale]);

  const duplicateRow = useCallback(async (rowIndex: number, blockType: string) => {
    dispatchFields({ type: 'DUPLICATE_ROW', rowIndex, path });
    dispatchRows({ type: 'ADD', rowIndex, blockType });
    setValue(value as number + 1);
  }, [dispatchRows, dispatchFields, path, setValue, value]);

  const removeRow = useCallback((rowIndex: number) => {
    dispatchRows({ type: 'REMOVE', rowIndex });
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
    setValue(value as number - 1);
  }, [path, setValue, value, dispatchFields]);

  const moveRow = useCallback((moveFromIndex: number, moveToIndex: number) => {
    dispatchRows({ type: 'MOVE', moveFromIndex, moveToIndex });
    dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path });
  }, [dispatchRows, dispatchFields, path]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  }, [moveRow]);

  const setCollapse = useCallback(async (rowID: string, collapsed: boolean) => {
    dispatchRows({ type: 'SET_COLLAPSE', id: rowID, collapsed });

    if (preferencesKey) {
      const preferencesToSet = preferences || { fields: {} };
      let newCollapsedState = preferencesToSet?.fields?.[path]?.collapsed
        .filter((filterID) => (rows.find((row) => row.id === filterID)))
        || [];

      if (!collapsed) {
        newCollapsedState = newCollapsedState.filter((existingID) => existingID !== rowID);
      } else {
        newCollapsedState.push(rowID);
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
  }, [preferencesKey, preferences, path, setPreference, rows]);

  const toggleCollapseAll = useCallback(async (collapse: boolean) => {
    dispatchRows({ type: 'SET_ALL_COLLAPSED', collapse });

    if (preferencesKey) {
      const preferencesToSet = preferences || { fields: {} };

      setPreference(preferencesKey, {
        ...preferencesToSet,
        fields: {
          ...preferencesToSet?.fields || {},
          [path]: {
            ...preferencesToSet?.fields?.[path],
            collapsed: collapse ? rows.map(({ id: rowID }) => rowID) : [],
          },
        },
      });
    }
  }, [path, preferences, preferencesKey, rows, setPreference]);

  // Set row count on mount and when form context is reset
  useEffect(() => {
    const data = formContext.getDataByPath<Row[]>(path);
    dispatchRows({ type: 'SET_ALL', data: data || [] });
  }, [formContext, path]);

  useEffect(() => {
    setValue(rows?.length || 0, true);

    if (rows?.length === 0) {
      setDisableFormData(false);
    } else {
      setDisableFormData(true);
    }
  }, [rows, setValue]);

  const hasMaxRows = maxRows && rows.length >= maxRows;

  const classes = [
    'field-type',
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className={classes}
      >
        <div className={`${baseClass}__error-wrap`}>
          <Error
            showError={showError}
            message={errorMessage}
          />
        </div>
        <header className={`${baseClass}__header`}>
          <div className={`${baseClass}__header-wrap`}>
            <h3>{label}</h3>
            <ul className={`${baseClass}__header-actions`}>
              <li>
                <button
                  type="button"
                  onClick={() => toggleCollapseAll(true)}
                  className={`${baseClass}__header-action`}
                >
                  Collapse All
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => toggleCollapseAll(false)}
                  className={`${baseClass}__header-action`}
                >
                  Show All
                </button>
              </li>
            </ul>
          </div>
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

                const rowNumber = i + 1;

                if (blockToRender) {
                  return (
                    <Draggable
                      key={row.id}
                      draggableId={row.id}
                      index={i}
                      isDragDisabled={readOnly}
                    >
                      {(providedDrag) => (
                        <div
                          id={`${path}-row-${i}`}
                          ref={providedDrag.innerRef}
                          {...providedDrag.draggableProps}
                        >
                          <Collapsible
                            collapsed={row.collapsed}
                            onToggle={(collapsed) => setCollapse(row.id, collapsed)}
                            className={`${baseClass}__row`}
                            key={row.id}
                            dragHandleProps={providedDrag.dragHandleProps}
                            header={(
                              <div className={`${baseClass}__block-header`}>
                                <span className={`${baseClass}__block-number`}>
                                  {rowNumber >= 10 ? rowNumber : `0${rowNumber}`}
                                </span>
                                <Pill className={`${baseClass}__block-pill ${baseClass}__block-pill-${blockType}`}>
                                  {blockToRender.labels.singular}
                                </Pill>
                              </div>
                            )}
                            actions={!readOnly ? (
                              <React.Fragment>
                                <Popup
                                  key={`${blockType}-${i}`}
                                  forceOpen={selectorIndexOpen === i}
                                  onToggleOpen={onAddPopupToggle}
                                  buttonType="none"
                                  size="large"
                                  horizontalAlign="right"
                                  render={({ close }) => (
                                    <BlockSelector
                                      blocks={blocks}
                                      addRow={addRow}
                                      addRowIndex={i}
                                      close={close}
                                    />
                                  )}
                                />
                                <ArrayAction
                                  rowCount={rows.length}
                                  duplicateRow={() => duplicateRow(i, blockType)}
                                  addRow={() => setSelectorIndexOpen(i)}
                                  moveRow={moveRow}
                                  removeRow={removeRow}
                                  index={i}
                                />
                              </React.Fragment>
                            ) : undefined}
                          >
                            <RenderFields
                              forceRender
                              readOnly={readOnly}
                              fieldTypes={fieldTypes}
                              permissions={permissions.fields}
                              fieldSchema={blockToRender.fields.map((field) => ({
                                ...field,
                                path: `${path}.${i}${fieldAffectsData(field) ? `.${field.name}` : ''}`,
                              }))}
                            />

                          </Collapsible>
                        </div>
                      )}
                    </Draggable>
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

        {(!readOnly && !hasMaxRows) && (
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
};

export default withCondition(Blocks);

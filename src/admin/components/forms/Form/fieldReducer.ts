import equal from 'deep-equal';
import ObjectID from 'bson-objectid';
import getSiblingData from './getSiblingData';
import reduceFieldsToValues from './reduceFieldsToValues';
import { Field, FieldAction, Fields } from './types';
import deepCopyObject from '../../../../utilities/deepCopyObject';
import { flattenRows, separateRows } from './rows';

export function fieldReducer(state: Fields, action: FieldAction): Fields {
  switch (action.type) {
    case 'REPLACE_STATE': {
      const newState = {};

      // Only update fields that have changed
      // by comparing old value / initialValue to new
      // ..
      // This is a performance enhancement for saving
      // large documents with hundreds of fields

      Object.entries(action.state).forEach(([path, field]) => {
        const oldField = state[path];
        const newField = field;

        if (!equal(oldField, newField)) {
          newState[path] = newField;
        } else if (oldField) {
          newState[path] = oldField;
        }
      });

      return newState;
    }

    case 'REMOVE': {
      const newState = { ...state };
      if (newState[action.path]) delete newState[action.path];
      return newState;
    }

    case 'MODIFY_CONDITION': {
      const { path, result, user } = action;

      return Object.entries(state).reduce((newState, [fieldPath, field]) => {
        if (fieldPath === path || fieldPath.indexOf(`${path}.`) === 0) {
          let passesCondition = result;

          // If a condition is being set to true,
          // Set all conditions to true
          // Besides those who still fail their own conditions

          if (passesCondition && field.condition) {
            passesCondition = field.condition(reduceFieldsToValues(state), getSiblingData(state, path), { user });
          }

          return {
            ...newState,
            [fieldPath]: {
              ...field,
              passesCondition,
            },
          };
        }

        return {
          ...newState,
          [fieldPath]: {
            ...field,
          },
        };
      }, {});
    }

    case 'UPDATE': {
      const newField = Object.entries(action).reduce((field, [key, value]) => {
        if (['value', 'valid', 'errorMessage', 'disableFormData', 'initialValue', 'validate', 'condition', 'passesCondition'].includes(key)) {
          return {
            ...field,
            [key]: value,
          };
        }

        return field;
      }, state[action.path] || {} as Field);

      return {
        ...state,
        [action.path]: newField,
      };
    }

    case 'REMOVE_ROW': {
      const { rowIndex, path } = action;
      const { remainingFields, rows } = separateRows(path, state);
      const rowsMetadata = state[path]?.rows || [];

      rows.splice(rowIndex, 1);
      rowsMetadata.splice(rowIndex, 1);


      const newState: Fields = {
        ...remainingFields,
        [path]: {
          ...state[path],
          value: rows.length,
          disableFormData: rows.length > 0,
          rows: rowsMetadata,
        },
        ...flattenRows(path, rows),
      };

      return newState;
    }

    case 'ADD_ROW': {
      const {
        rowIndex, path, subFieldState, blockType,
      } = action;

      const rowsMetadata = state[path]?.rows || [];
      rowsMetadata.splice(
        rowIndex + 1,
        0,
        // new row
        {
          id: new ObjectID().toHexString(),
          collapsed: false,
          blockType: blockType || undefined,
        },
      );

      if (blockType) {
        subFieldState.blockType = {
          value: blockType,
          initialValue: blockType,
          valid: true,
        };
      }

      const { remainingFields, rows } = separateRows(path, state);

      // actual form state (value saved in db)
      rows.splice(rowIndex + 1, 0, subFieldState);

      const newState: Fields = {
        ...remainingFields,
        [path]: {
          ...state[path],
          value: rows.length,
          disableFormData: true,
          rows: rowsMetadata,
        },
        ...flattenRows(path, rows),
      };

      return newState;
    }

    case 'DUPLICATE_ROW': {
      const { rowIndex, path } = action;
      const { remainingFields, rows } = separateRows(path, state);
      const rowsMetadata = state[path]?.rows || [];

      const duplicateRowMetadata = deepCopyObject(rowsMetadata[rowIndex]);
      if (duplicateRowMetadata.id) delete duplicateRowMetadata.id;

      const duplicateRowState = deepCopyObject(rows[rowIndex]);
      if (duplicateRowState.id) delete duplicateRowState.id;

      // If there are subfields
      if (Object.keys(duplicateRowState).length > 0) {
        // Add new object containing subfield names to unflattenedRows array
        rows.splice(rowIndex + 1, 0, duplicateRowState);
        rowsMetadata.splice(rowIndex + 1, 0, duplicateRowMetadata);
      }

      const newState = {
        ...remainingFields,
        [path]: {
          ...state[path],
          value: rows.length,
          disableFormData: true,
          rows: rowsMetadata,
        },
        ...flattenRows(path, rows),
      };

      return newState;
    }

    case 'MOVE_ROW': {
      const { moveFromIndex, moveToIndex, path } = action;
      const { remainingFields, rows } = separateRows(path, state);

      // copy the row to move
      const copyOfMovingRow = rows[moveFromIndex];
      // delete the row by index
      rows.splice(moveFromIndex, 1);
      // insert row copyOfMovingRow back in
      rows.splice(moveToIndex, 0, copyOfMovingRow);

      const newState = {
        ...remainingFields,
        ...flattenRows(path, rows),
      };

      return newState;
    }

    case 'SET_ROW_COLLAPSED': {
      const { rowID, path, collapsed, setDocFieldPreferences } = action;

      const arrayState = state[path];

      const { matchedIndex, collapsedRowIDs } = state[path].rows.reduce((acc, row, index) => {
        const isMatchingRow = row.id === rowID;
        if (isMatchingRow) acc.matchedIndex = index;

        if (!isMatchingRow && row.collapsed) acc.collapsedRowIDs.push(row.id);
        else if (isMatchingRow && collapsed) acc.collapsedRowIDs.push(row.id);

        return acc;
      }, {
        matchedIndex: undefined,
        collapsedRowIDs: [],
      });

      if (matchedIndex > -1) {
        arrayState.rows[matchedIndex].collapsed = collapsed;
        setDocFieldPreferences(path, { collapsed: collapsedRowIDs });
      }

      const newState = {
        ...state,
        [path]: {
          ...arrayState,
        },
      };

      return newState;
    }

    case 'SET_ALL_ROWS_COLLAPSED': {
      const { collapsed, path, setDocFieldPreferences } = action;

      const { rows, collapsedRowIDs } = state[path].rows.reduce((acc, row) => {
        if (collapsed) acc.collapsedRowIDs.push(row.id);

        acc.rows.push({
          ...row,
          collapsed,
        });

        return acc;
      }, {
        rows: [],
        collapsedRowIDs: [],
      });

      setDocFieldPreferences(path, { collapsed: collapsedRowIDs });

      return {
        ...state,
        [path]: {
          ...state[path],
          rows,
        },
      };
    }

    default: {
      return state;
    }
  }
}

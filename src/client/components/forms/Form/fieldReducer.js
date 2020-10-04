import { unflatten, flatten } from 'flatley';
import flattenFilters from './flattenFilters';

//
const unflattenRowsFromState = (state, path) => {
  // Take a copy of state
  const remainingFlattenedState = { ...state };

  const rowsFromStateObject = {};

  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1);

  // Loop over all keys from state
  // If the key begins with the name of the parent field,
  // Add value to rowsFromStateObject and delete it from remaining state
  Object.keys(state).forEach((key) => {
    if (key.indexOf(`${path}.`) === 0) {
      if (!state[key].ignoreWhileFlattening) {
        const name = key.replace(pathPrefixToRemove, '');
        rowsFromStateObject[name] = state[key];
        rowsFromStateObject[name].initialValue = rowsFromStateObject[name].value;
      }

      delete remainingFlattenedState[key];
    }
  });

  const unflattenedRows = unflatten(rowsFromStateObject);

  return {
    unflattenedRows: unflattenedRows[path.replace(pathPrefixToRemove, '')] || [],
    remainingFlattenedState,
  };
};

function fieldReducer(state, action) {
  switch (action.type) {
    case 'REPLACE_STATE': {
      return action.state;
    }

    case 'REMOVE': {
      const newState = { ...state };
      delete newState[action.path];
      return newState;
    }

    case 'REMOVE_ROW': {
      const { rowIndex, path } = action;
      const { unflattenedRows, remainingFlattenedState } = unflattenRowsFromState(state, path);

      unflattenedRows.splice(rowIndex, 1);

      const flattenedRowState = unflattenedRows.length > 0 ? flatten({ [path]: unflattenedRows }, { filters: flattenFilters }) : {};

      return {
        ...remainingFlattenedState,
        ...flattenedRowState,
      };
    }

    case 'ADD_ROW': {
      const {
        rowIndex, path, fieldSchema, blockType,
      } = action;
      const { unflattenedRows, remainingFlattenedState } = unflattenRowsFromState(state, path);

      // Get paths of sub fields
      const subFields = fieldSchema.reduce((acc, field) => {
        if (field.type === 'flexible' || field.type === 'repeater') {
          return acc;
        }

        if (field.name) {
          return {
            ...acc,
            [field.name]: {
              value: null,
              valid: !field.required,
            },
          };
        }

        if (field.fields) {
          return {
            ...acc,
            ...(field.fields.reduce((fields, subField) => ({
              ...fields,
              [subField.name]: {
                value: null,
                valid: !field.required,
              },
            }), {})),
          };
        }

        return acc;
      }, {});

      if (blockType) {
        subFields.blockType = {
          value: blockType,
          initialValue: blockType,
          valid: true,
        };

        subFields.blockName = {
          value: null,
          initialValue: null,
          valid: true,
        };
      }

      // Add new object containing subfield names to unflattenedRows array
      unflattenedRows.splice(rowIndex + 1, 0, subFields);

      const newState = {
        ...remainingFlattenedState,
        ...(flatten({ [path]: unflattenedRows }, { filters: flattenFilters })),
      };

      return newState;
    }

    case 'MOVE_ROW': {
      const { moveFromIndex, moveToIndex, path } = action;
      const { unflattenedRows, remainingFlattenedState } = unflattenRowsFromState(state, path);

      // copy the row to move
      const copyOfMovingRow = unflattenedRows[moveFromIndex];
      // delete the row by index
      unflattenedRows.splice(moveFromIndex, 1);
      // insert row copyOfMovingRow back in
      unflattenedRows.splice(moveToIndex, 0, copyOfMovingRow);

      const newState = {
        ...remainingFlattenedState,
        ...(flatten({ [path]: unflattenedRows }, { filters: flattenFilters })),
      };

      return newState;
    }

    default: {
      const newField = {
        value: action.value,
        valid: action.valid,
        errorMessage: action.errorMessage,
        disableFormData: action.disableFormData,
        ignoreWhileFlattening: action.ignoreWhileFlattening,
        initialValue: action.initialValue,
        stringify: action.stringify,
        validate: action.validate,
      };

      return {
        ...state,
        [action.path]: newField,
      };
    }
  }
}

export default fieldReducer;

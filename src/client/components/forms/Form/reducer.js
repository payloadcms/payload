import { unflatten, flatten } from 'flatley';
import flattenFilters from './flattenFilters';

//
const unflattenRowsFromState = (state, name) => {
  // Take a copy of state
  const remainingFlattenedState = { ...state };

  const rowsFromStateObject = {};

  const namePrefixToRemove = name.substring(0, name.lastIndexOf('.') + 1);

  // Loop over all keys from state
  // If the key begins with the name of the parent field,
  // Add value to rowsFromStateObject and delete it from remaining state
  Object.keys(state).forEach((key) => {
    if (key.indexOf(`${name}.`) === 0) {
      rowsFromStateObject[key.replace(namePrefixToRemove, '')] = state[key];
      delete remainingFlattenedState[key];
    }
  });

  const unflattenedRows = unflatten(rowsFromStateObject);

  return {
    unflattenedRows: unflattenedRows[name.replace(namePrefixToRemove, '')] || [],
    remainingFlattenedState,
  };
};

function fieldReducer(state, action) {
  switch (action.type) {
    case 'REPLACE_ALL':
      return {
        ...action.value,
      };

    case 'REMOVE_ROW': {
      const { rowIndex, name } = action;
      const { unflattenedRows, remainingFlattenedState } = unflattenRowsFromState(state, name);

      unflattenedRows.splice(rowIndex, 1);

      const flattenedRowState = unflattenedRows.length > 0 ? flatten({ [name]: unflattenedRows }, { filters: flattenFilters }) : {};

      return {
        ...remainingFlattenedState,
        ...flattenedRowState,
      };
    }

    case 'ADD_ROW': {
      const {
        rowIndex, name, fieldSchema, blockType,
      } = action;
      const { unflattenedRows, remainingFlattenedState } = unflattenRowsFromState(state, name);

      // Get names of sub fields
      const subFields = fieldSchema.reduce((acc, field) => {
        if (field.type === 'flexible' || field.type === 'repeater') {
          return acc;
        }

        return {
          ...acc,
          [field.name]: {
            value: null,
            valid: !field.required,
          },
        };
      }, {});

      if (blockType) {
        subFields.blockType = {
          value: blockType,
          valid: true,
        };
      }

      // Add new object containing subfield names to unflattenedRows array
      unflattenedRows.splice(rowIndex + 1, 0, subFields);

      return {
        ...remainingFlattenedState,
        ...(flatten({ [name]: unflattenedRows }, { filters: flattenFilters })),
      };
    }

    case 'MOVE_ROW': {
      const { moveFromIndex, moveToIndex, name } = action;
      const { unflattenedRows, remainingFlattenedState } = unflattenRowsFromState(state, name);

      // copy the row to move
      const copyOfMovingRow = unflattenedRows[moveFromIndex];
      // delete the row by index
      unflattenedRows.splice(moveFromIndex, 1);
      // insert row copyOfMovingRow back in
      unflattenedRows.splice(moveToIndex, 0, copyOfMovingRow);

      return {
        ...remainingFlattenedState,
        ...(flatten({ [name]: unflattenedRows }, { filters: flattenFilters })),
      };
    }

    case 'REMOVE': {
      const newState = { ...state };
      delete newState[action.name];
      return newState;
    }

    default:
      return {
        ...state,
        [action.name]: {
          value: action.value,
          valid: action.valid,
        },
      };
  }
}

export default fieldReducer;

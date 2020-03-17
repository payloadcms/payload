import { unflatten, flatten } from 'flat';

const splitRowsFromState = (state, name) => {
  // Take a copy of state
  const remainingState = { ...state };

  const rowsFromStateObject = {};

  // Loop over all keys from state
  // If the key begins with the name of the parent field,
  // Add value to rowsFromStateObject and delete it from remaining state
  Object.keys(state).forEach((key) => {
    if (key.indexOf(`${name}.`) === 0) {
      rowsFromStateObject[key] = state[key];
      delete remainingState[key];
    }
  });

  const rowsFromState = unflatten(rowsFromStateObject);

  return {
    rowsFromState: rowsFromState[name] || [],
    remainingState,
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
      const { rowsFromState, remainingState } = splitRowsFromState(state, name);

      rowsFromState.splice(rowIndex, 1);

      return {
        ...remainingState,
        ...(flatten({ [name]: rowsFromState }, { maxDepth: 3 })),
      };
    }

    case 'ADD_ROW': {
      const { rowIndex, name, fields } = action;
      const { rowsFromState, remainingState } = splitRowsFromState(state, name);

      // Get names of sub fields
      const subFields = fields.reduce((acc, field) => ({ ...acc, [field.name]: {} }), {});

      // Add new object containing subfield names to rowsFromState array
      rowsFromState.splice(rowIndex + 1, 0, subFields);

      return {
        ...remainingState,
        ...(flatten({ [name]: rowsFromState }, { maxDepth: 3 })),
      };
    }

    case 'MOVE_ROW': {
      const { moveFromIndex, moveToIndex, name } = action;
      const { rowsFromState, remainingState } = splitRowsFromState(state, name);

      // copy the row to move
      const copyOfMovingRow = rowsFromState[moveFromIndex];
      // delete the row by index
      rowsFromState.splice(moveFromIndex, 1);
      // insert row copyOfMovingRow back in
      rowsFromState.splice(moveToIndex, 0, copyOfMovingRow);

      return {
        ...remainingState,
        ...(flatten({ [name]: rowsFromState }, { maxDepth: 3 })),
      };
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

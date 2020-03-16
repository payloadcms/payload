import { unflatten, flatten } from 'flat';

const splitRowsFromState = (state, name) => {
  // Take a copy of state
  const remainingState = { ...state };

  const rowObject = {};

  // Loop over all keys from state
  // If the key begins with the name of the parent field,
  // Add value to rowObject and delete it from remaining state
  Object.keys(state).forEach((key) => {
    if (key.indexOf(`${name}.`) === 0) {
      rowObject[key] = state[key];
      delete remainingState[key];
    }
  });

  const rows = unflatten(rowObject);

  return {
    rows: rows[name] || [],
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
      const { rows, remainingState } = splitRowsFromState(state, name);

      rows.splice(rowIndex, 1);

      return {
        ...remainingState,
        ...(flatten({ [name]: rows }, { maxDepth: 3 })),
      };
    }

    case 'ADD_ROW': {
      const { rowIndex, name, fields } = action;
      const { rows, remainingState } = splitRowsFromState(state, name);

      // Get names of sub fields
      const subFields = fields.reduce((acc, field) => ({ ...acc, [field.name]: {} }), {});

      // Add new object containing subfield names to rows array
      rows.splice(rowIndex + 1, 0, subFields);

      return {
        ...remainingState,
        ...(flatten({ [name]: rows }, { maxDepth: 3 })),
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

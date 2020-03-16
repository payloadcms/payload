import { unflatten, flatten } from 'flat';

const splitRowsFromState = (state, name) => {
  const remainingState = { ...state };
  const rowObject = Object.keys(state).reduce((acc, key) => {
    if (key.indexOf(`${name}.`) === 0) {
      acc[key] = state[key];
      delete remainingState[key];
    }

    return acc;
  }, {});

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

      const subFields = fields.reduce((acc, field) => ({ ...acc, [field.name]: {} }), {});
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

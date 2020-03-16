import { unflatten, flatten } from 'flat';

function fieldReducer(state, action) {
  switch (action.type) {
    case 'REPLACE_ALL':
      return {
        ...action.value,
      };

    case 'REMOVE_ROW': {
      return {
        ...state,
      };
    }

    case 'ADD_ROW': {
      const { rowIndex, name, fields } = action;

      const newState = { ...state };

      const rows = {};

      Object.keys(newState).forEach((key) => {
        if (key.indexOf(`${name}.`) === 0) {
          rows[key] = newState[key];
          delete newState[key];
        }
      });

      const unflattenedRows = unflatten(rows);

      if (!unflattenedRows[name]) unflattenedRows[name] = [];

      const subFields = fields.reduce((acc, field) => ({ ...acc, [field.name]: {} }), {});

      unflattenedRows[name].splice(rowIndex + 1, 0, subFields);

      const finalState = {
        ...newState,
        ...(flatten(unflattenedRows, { maxDepth: 3 })),
      };

      return finalState;
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

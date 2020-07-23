function fieldReducer(state, action) {
  switch (action.type) {
    case 'REPLACE_ALL':
      return {
        ...action.value,
      };

    case 'REPLACE_ALL_BY_PATH': {
      const { path, value = {} } = action;

      const newState = Object.entries(state).reduce((reducedState, [key, val]) => {
        if (key.indexOf(`${path}`) === 0) {
          return reducedState;
        }

        return {
          ...reducedState,
          [key]: val,
        };
      }, {});

      return {
        ...newState,
        ...value,
      };
    }

    case 'REMOVE': {
      const newState = { ...state };
      delete newState[action.path];
      return newState;
    }

    default: {
      const newField = {
        value: action.value,
        valid: action.valid,
        errorMessage: action.errorMessage,
      };

      if (action.disableFormData) newField.disableFormData = action.disableFormData;

      return {
        ...state,
        [action.path]: newField,
      };
    }
  }
}

export default fieldReducer;

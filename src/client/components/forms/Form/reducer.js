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
      return {
        ...state,
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

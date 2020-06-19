function fieldReducer(state, action) {
  switch (action.type) {
    case 'REPLACE_ALL':
      return {
        ...action.value,
      };

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

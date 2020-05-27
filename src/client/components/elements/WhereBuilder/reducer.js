const initialCondition = {
  operators: [],
};

const reducer = (state, action = {}) => {
  const newState = [...state];

  const {
    type,
    relation,
    orIndex,
    andIndex,
    field,
    operator,
    value,
  } = action;

  switch (type) {
    case 'add': {
      if (relation === 'and') {
        newState[orIndex].splice(andIndex, 0, initialCondition);
        return newState;
      }

      return [
        ...newState,
        [initialCondition],
      ];
    }

    case 'remove': {
      newState[orIndex].splice(andIndex, 1);

      if (newState[orIndex].length === 0) {
        newState.splice(orIndex, 1);
      }

      return newState;
    }

    case 'update': {
      newState[orIndex][andIndex] = {
        ...newState[orIndex][andIndex],
      };

      if (operator) {
        newState[orIndex][andIndex].operator = operator;
      }

      if (field) {
        newState[orIndex][andIndex].field = field;
      }

      if (value) {
        newState[orIndex][andIndex].value = value;
      }

      return newState;
    }

    default: {
      return newState;
    }
  }
};

export default reducer;

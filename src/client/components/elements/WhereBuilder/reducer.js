const reducer = (state, {
  type, payload: {
    relation, orIndex, andIndex,
  } = {},
}) => {
  const newState = [...state];

  switch (type) {
    case 'add': {
      if (relation === 'and') {
        newState[orIndex].splice(andIndex, 0, {});
        return newState;
      }

      return [
        ...newState,
        [{}],
      ];
    }

    case 'remove': {
      newState[orIndex].splice(andIndex, 1);

      if (newState[orIndex].length === 0) {
        newState.splice(orIndex, 1);
      }

      return newState;
    }

    default: {
      return newState;
    }
  }
};

export default reducer;

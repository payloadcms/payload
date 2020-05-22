const reducer = (state, { type, payload }) => {
  switch (type) {
    case 'add': {
      return [
        ...state,
        payload.condition,
      ];
    }

    case 'remove': {
      const newState = [...state];
      newState.splice(payload.index);
      return newState;
    }

    default: {
      return state;
    }
  }
};

export default reducer;

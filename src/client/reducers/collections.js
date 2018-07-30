const defaultState = {
  all: []
};

export default (state = defaultState, action) => {
  switch (action.type) {
  case 'LOAD_COLLECTIONS':
    return {
      ...state,
      all: action.payload
    };

  default:
      //
  }

  return state;
};

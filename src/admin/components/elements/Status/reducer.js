const statusReducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const newState = [
        ...state,
        action.payload,
      ];

      return newState;
    }


    case 'REMOVE': {
      const statusList = [...state];
      statusList.splice(action.payload, 1);
      return statusList;
    }

    case 'CLEAR': {
      return [];
    }

    case 'REPLACE': {
      return action.payload;
    }

    default:
      return state;
  }
};

export default statusReducer;

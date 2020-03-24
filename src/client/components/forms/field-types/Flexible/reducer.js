const collapsibleReducer = (currentState, action) => {
  const {
    type, collapsibleIndex, moveToIndex, payload,
  } = action;

  const stateCopy = [...currentState];
  const movingCollapsibleState = stateCopy[collapsibleIndex];

  switch (type) {
    case 'SET_ALL_COLLAPSIBLES':
      return payload;

    case 'ADD_COLLAPSIBLE':
      stateCopy.splice(collapsibleIndex + 1, 0, true);
      return stateCopy;

    case 'REMOVE_COLLAPSIBLE':
      stateCopy.splice(collapsibleIndex, 1);
      return stateCopy;

    case 'UPDATE_COLLAPSIBLE_STATUS':
      stateCopy[collapsibleIndex] = !movingCollapsibleState;
      return stateCopy;

    case 'MOVE_COLLAPSIBLE':
      stateCopy.splice(collapsibleIndex, 1);
      stateCopy.splice(moveToIndex, 0, movingCollapsibleState);
      return stateCopy;

    default:
      return currentState;
  }
};

export default collapsibleReducer;

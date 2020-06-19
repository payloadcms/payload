import { v4 as uuidv4 } from 'uuid';

const reducer = (currentState, action) => {
  const {
    type, index, moveToIndex, payload, data,
  } = action;

  const stateCopy = [...currentState];
  const movingRowState = stateCopy[index];

  switch (type) {
    case 'SET_ALL':
      return payload;

    case 'ADD':
      stateCopy.splice(index + 1, 0, {
        open: true,
        key: uuidv4(),
        data,
      });
      return stateCopy;

    case 'REMOVE':
      stateCopy.splice(index, 1);
      return stateCopy;

    case 'UPDATE_COLLAPSIBLE_STATUS':
      stateCopy[index].open = !movingRowState.open;
      return stateCopy;

    case 'MOVE':
      stateCopy.splice(index, 1);
      stateCopy.splice(moveToIndex, 0, movingRowState);
      return stateCopy;

    default:
      return currentState;
  }
};

export default reducer;

import { v4 as uuidv4 } from 'uuid';

const reducer = (currentState, action) => {
  const {
    type, index, moveToIndex, rows, data = [], initialRowData = {},
  } = action;

  const stateCopy = [...currentState];

  switch (type) {
    case 'SET_ALL':
      return rows;

    case 'ADD':
      stateCopy.splice(index + 1, 0, {
        open: true,
        key: uuidv4(),
        data,
      });

      data.splice(index + 1, 0, initialRowData);

      return stateCopy.map((row, i) => {
        return {
          ...row,
          data: {
            ...(data[i] || {}),
          },
        };
      });

    case 'REMOVE':
      stateCopy.splice(index, 1);
      return stateCopy;

    case 'UPDATE_COLLAPSIBLE_STATUS':
      stateCopy[index].open = !stateCopy[index].open;
      return stateCopy;

    case 'MOVE': {
      const stateCopyWithNewData = stateCopy.map((row, i) => {
        return {
          ...row,
          data: {
            ...(data[i] || {}),
          },
        };
      });

      const movingRowState = { ...stateCopyWithNewData[index] };
      stateCopyWithNewData.splice(index, 1);
      stateCopyWithNewData.splice(moveToIndex, 0, movingRowState);

      return stateCopyWithNewData;
    }

    default:
      return currentState;
  }
};

export default reducer;

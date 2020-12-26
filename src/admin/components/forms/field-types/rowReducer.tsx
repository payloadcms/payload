import { v4 as uuidv4 } from 'uuid';

const reducer = (currentState, action) => {
  const {
    type, rowIndex, moveFromIndex, moveToIndex, data, blockType,
  } = action;

  const stateCopy = [...currentState];

  switch (type) {
    case 'SET_ALL': {
      if (Array.isArray(data)) {
        return data.map((dataRow) => {
          const row = {
            key: uuidv4(),
            open: true,
            blockType: undefined,
          };

          if (dataRow.blockType) {
            row.blockType = dataRow.blockType;
          }

          return row;
        });
      }

      return [];
    }

    case 'TOGGLE_COLLAPSE':
      stateCopy[rowIndex].open = !stateCopy[rowIndex].open;
      return stateCopy;

    case 'ADD': {
      const newRow = {
        open: true,
        key: uuidv4(),
        blockType: undefined,
      };

      if (blockType) newRow.blockType = blockType;

      stateCopy.splice(rowIndex + 1, 0, newRow);

      return stateCopy;
    }

    case 'REMOVE':
      stateCopy.splice(rowIndex, 1);
      return stateCopy;

    case 'MOVE': {
      const movingRowState = { ...stateCopy[moveFromIndex] };
      stateCopy.splice(moveFromIndex, 1);
      stateCopy.splice(moveToIndex, 0, movingRowState);
      return stateCopy;
    }

    default:
      return currentState;
  }
};

export default reducer;

const rowReducer = (currentState, action) => {
  const {
    type, rowIndex, moveToIndex, payload, blockType,
  } = action;

  const newState = [...currentState];

  switch (type) {
    case 'LOAD_ROWS':
      return payload.reduce((acc, row) => {
        acc.push({
          blockType: row.blockType,
          isOpen: true,
        });

        return acc;
      }, []);

    case 'ADD':
      newState.splice(rowIndex + 1, 0, { blockType, isOpen: true });
      return newState;

    case 'REMOVE':
      newState.splice(rowIndex, 1);
      return newState;

    case 'UPDATE_IS_ROW_OPEN': {
      const movingRow = newState[rowIndex];
      newState[rowIndex] = {
        ...movingRow,
        isOpen: !movingRow.isOpen,
      };
      return newState;
    }

    case 'MOVE': {
      const movingRow = newState[rowIndex];
      newState.splice(rowIndex, 1);
      newState.splice(moveToIndex, 0, movingRow);
      return newState;
    }

    default:
      return currentState;
  }
};

export default rowReducer;

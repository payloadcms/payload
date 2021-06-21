import ObjectID from 'bson-objectid';

const reducer = (currentState, action) => {
  const {
    type, rowIndex, moveFromIndex, moveToIndex, data, blockType, collapsedState, collapsed, id,
  } = action;

  const stateCopy = [...currentState];

  switch (type) {
    case 'SET_ALL': {
      if (Array.isArray(data)) {
        return data.map((dataRow, i) => {
          const row = {
            id: dataRow?.id || new ObjectID().toHexString(),
            collapsed: (collapsedState || []).includes(dataRow?.id),
            blockType: dataRow?.blockType,
          };

          return row;
        });
      }

      return [];
    }

    case 'SET_COLLAPSE': {
      const matchedRowIndex = stateCopy.findIndex(({ id: rowID }) => rowID === id);

      if (matchedRowIndex > -1 && stateCopy[matchedRowIndex]) {
        stateCopy[matchedRowIndex].collapsed = collapsed;
      }

      return stateCopy;
    }

    case 'ADD': {
      const newRow = {
        id: new ObjectID().toHexString(),
        open: true,
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

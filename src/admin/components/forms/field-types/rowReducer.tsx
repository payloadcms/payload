import { v4 as uuidv4 } from 'uuid';

const reducer = (currentState, action) => {
  const {
    type, rowIndex, moveFromIndex, moveToIndex, data, blockType, collapsedState, collapsed, _key,
  } = action;

  const stateCopy = [...currentState];

  switch (type) {
    case 'SET_ALL': {
      if (Array.isArray(data)) {
        if (currentState.length !== data.length) {
          return data.map((dataRow) => {
            const row = {
              _key: dataRow?._key || uuidv4(),
              collapsed: (collapsedState || []).includes(dataRow?._key),
              blockType: dataRow?.blockType,
            };

            return row;
          });
        }

        return currentState;
      }

      return [];
    }

    case 'SET_COLLAPSE': {
      const matchedRowIndex = stateCopy.findIndex(({ _key: rowID }) => rowID === _key);

      if (matchedRowIndex > -1 && stateCopy[matchedRowIndex]) {
        stateCopy[matchedRowIndex].collapsed = collapsed;
      }
      return stateCopy;
    }

    case 'ADD': {
      const newRow = {
        open: true,
        _key: uuidv4(),
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

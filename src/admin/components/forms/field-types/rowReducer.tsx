import ObjectID from 'bson-objectid';

export type Row = {
  id: string
  collapsed?: boolean
  blockType?: string
}

type SET_ALL = {
  type: 'SET_ALL'
  data: { id?: string, blockType?: string }[]
  collapsedState?: string[]
  blockType?: string
  initCollapsed?: boolean
}

type SET_COLLAPSE = {
  type: 'SET_COLLAPSE'
  id: string
  collapsed: boolean
}

type SET_ALL_COLLAPSED = {
  type: 'SET_ALL_COLLAPSED'
  collapse: boolean
}

type ADD = {
  type: 'ADD'
  rowIndex: number
  blockType?: string
}

type REMOVE = {
  type: 'REMOVE'
  rowIndex: number
}

type MOVE = {
  type: 'MOVE'
  moveFromIndex: number
  moveToIndex: number
}

type Action = SET_ALL | SET_COLLAPSE | SET_ALL_COLLAPSED | ADD | REMOVE | MOVE;

const reducer = (currentState: Row[], action: Action): Row[] => {
  const stateCopy = [...currentState || []];

  switch (action.type) {
    case 'SET_ALL': {
      const { data, collapsedState, initCollapsed } = action;

      if (Array.isArray(data)) {
        return data.map((dataRow, i) => {
          const row = {
            id: dataRow?.id || new ObjectID().toHexString(),
            collapsed: Array.isArray(collapsedState) ? collapsedState.includes(dataRow?.id) : initCollapsed,
            blockType: dataRow?.blockType,
          };

          return row;
        });
      }

      return [];
    }

    case 'SET_COLLAPSE': {
      const { collapsed, id } = action;

      const matchedRowIndex = stateCopy.findIndex(({ id: rowID }) => rowID === id);

      if (matchedRowIndex > -1 && stateCopy[matchedRowIndex]) {
        stateCopy[matchedRowIndex].collapsed = collapsed;
      }

      return stateCopy;
    }

    case 'SET_ALL_COLLAPSED': {
      const { collapse } = action;

      const newState = stateCopy.map((row) => ({
        ...row,
        collapsed: collapse,
      }));

      return newState;
    }

    case 'ADD': {
      const { rowIndex, blockType } = action;

      const newRow = {
        id: new ObjectID().toHexString(),
        collapsed: false,
        blockType: undefined,
      };

      if (blockType) newRow.blockType = blockType;

      stateCopy.splice(rowIndex + 1, 0, newRow);

      return stateCopy;
    }

    case 'REMOVE': {
      const { rowIndex } = action;
      stateCopy.splice(rowIndex, 1);
      return stateCopy;
    }

    case 'MOVE': {
      const { moveFromIndex, moveToIndex } = action;
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

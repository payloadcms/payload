import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import buildColumns from './buildColumns';

type TOGGLE = {
  type: 'toggle',
  payload: {
    column: string
    collection: SanitizedCollectionConfig
  }
}

type SET = {
  type: 'set',
  payload: {
    columns: Pick<Column, 'accessor' | 'active'>[]
    collection: SanitizedCollectionConfig
  }
}

type MOVE = {
  type: 'move',
  payload: {
    fromIndex: number
    toIndex: number
    collection: SanitizedCollectionConfig
  }
}

export type Action = TOGGLE | SET | MOVE;

export const columnReducer = (state: Column[], action: Action): Column[] => {
  switch (action.type) {
    case 'toggle': {
      const {
        column,
        collection,
      } = action.payload;

      const withToggledColumn = state.map((col) => {
        if (col.name === column) {
          return {
            ...col,
            active: !col.active,
          };
        }

        return col;
      });

      return buildColumns({
        columns: withToggledColumn,
        collection,
      });
    }
    case 'move': {
      const {
        fromIndex,
        toIndex,
        collection,
      } = action.payload;

      const withMovedColumn = [...state];
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1);
      withMovedColumn.splice(toIndex, 0, columnToMove);

      return buildColumns({
        columns: withMovedColumn,
        collection,
      });
    }
    case 'set': {
      const {
        columns,
        collection,
      } = action.payload;

      return buildColumns({
        columns,
        collection,
      });
    }
    default:
      return state;
  }
};

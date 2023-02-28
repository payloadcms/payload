import { TFunction } from 'react-i18next';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import buildColumns from './buildColumns';

type TOGGLE = {
  type: 'toggle',
  payload: {
    column: string
    t: TFunction
    collection: SanitizedCollectionConfig
  }
}

type SET = {
  type: 'set',
  payload: {
    columns: Pick<Column, 'accessor' | 'active'>[]
    t: TFunction
    collection: SanitizedCollectionConfig
  }
}

type MOVE = {
  type: 'move',
  payload: {
    fromIndex: number
    toIndex: number
    t: TFunction
    collection: SanitizedCollectionConfig
  }
}

export type Action = TOGGLE | SET | MOVE;

export const columnReducer = (state: Column[], action: Action): Column[] => {
  switch (action.type) {
    case 'toggle': {
      const {
        column,
        t,
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
        t,
      });
    }
    case 'move': {
      const {
        fromIndex,
        toIndex,
        t,
        collection,
      } = action.payload;

      const withMovedColumn = [...state];
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1);
      withMovedColumn.splice(toIndex, 0, columnToMove);

      return buildColumns({
        columns: withMovedColumn,
        collection,
        t,
      });
    }
    case 'set': {
      const {
        columns,
        t,
        collection,
      } = action.payload;

      return buildColumns({
        columns,
        collection,
        t,
      });
    }
    default:
      return state;
  }
};

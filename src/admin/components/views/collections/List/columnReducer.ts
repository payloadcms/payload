import { TFunction } from 'react-i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { Column } from '../../../elements/Table/types';
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
    activeColumns: string[]
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

      const activeColumnsNames = state.filter((c) => c.active).map((c) => c.accessor);
      if (activeColumnsNames.includes(column)) {
        const index = activeColumnsNames.indexOf(column);
        activeColumnsNames.splice(index, 1);
      } else {
        activeColumnsNames.push(column);
      }

      return buildColumns({
        activeColumns: activeColumnsNames,
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

      const activeColumnsNames = state.filter((c) => c.active).map((c) => c.accessor);
      const [columnToMove] = activeColumnsNames.splice(fromIndex, 1);
      activeColumnsNames.splice(toIndex, 0, columnToMove);

      return buildColumns({
        activeColumns: activeColumnsNames,
        collection,
        t,
      });
    }
    case 'set': {
      const {
        activeColumns,
        t,
        collection,
      } = action.payload;

      return buildColumns({
        activeColumns,
        collection,
        t,
      });
    }
    default:
      return state;
  }
};

import { OrClause, Action } from './types';

const reducer = (state: OrClause[], action: Action): OrClause[] => {
  const newState = [...state];

  const {
    orIndex,
    andIndex,
  } = action;

  switch (action.type) {
    case 'add': {
      const { relation } = action;

      if (relation === 'and') {
        newState[orIndex].splice(andIndex, 0, {});
        return newState;
      }

      return [
        ...newState,
        [{}],
      ];
    }

    case 'remove': {
      newState[orIndex].splice(andIndex, 1);

      if (newState[orIndex].length === 0) {
        newState.splice(orIndex, 1);
      }

      return newState;
    }

    case 'update': {
      const { field, operator, value } = action;

      newState[orIndex][andIndex] = {
        ...newState[orIndex][andIndex],
      };

      if (operator) {
        newState[orIndex][andIndex].operator = operator;
      }

      if (field) {
        newState[orIndex][andIndex].field = field;
      }

      if (value !== undefined) {
        newState[orIndex][andIndex].value = value;
      }

      return newState;
    }

    default: {
      return newState;
    }
  }
};

export default reducer;

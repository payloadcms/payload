import { Documents } from './index';
import { TypeWithID } from '../../../../../../collections/config/types';

type RequestDocuments = {
  type: 'REQUEST',
  docs: { relationTo: string, value: number | string }[],
}

type AddLoadedDocuments = {
  type: 'ADD_LOADED',
  relationTo: string,
  docs: TypeWithID[],
  idsToLoad: (string | number)[]
}

type Action = RequestDocuments | AddLoadedDocuments;

export function reducer(state: Documents, action: Action): Documents {
  switch (action.type) {
    case 'REQUEST': {
      const newState = { ...state };

      action.docs.forEach(({ relationTo, value }) => {
        if (typeof newState[relationTo] !== 'object') {
          newState[relationTo] = {};
        }
        newState[relationTo][value] = null;
      });

      return newState;
    }

    case 'ADD_LOADED': {
      const newState = { ...state };
      if (typeof newState[action.relationTo] !== 'object') {
        newState[action.relationTo] = {};
      }
      const unreturnedIDs = [...action.idsToLoad];

      if (Array.isArray(action.docs)) {
        action.docs.forEach((doc) => {
          unreturnedIDs.splice(unreturnedIDs.indexOf(doc.id), 1);
          newState[action.relationTo][doc.id] = doc;
        });
      }

      unreturnedIDs.forEach((id) => {
        newState[action.relationTo][id] = false;
      });

      return newState;
    }

    default: {
      return state;
    }
  }
}

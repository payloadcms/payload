import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import querystring from 'qs';
import { useConfig } from '../../../../utilities/Config';
import { requests } from '../../../../../api';
import { TypeWithID } from '../../../../../../collections/config/types';
import { reducer } from './reducer';
import useDebounce from '../../../../../hooks/useDebounce';

export type Documents = {
 [slug: string]: {
   [id: string | number]: TypeWithID | null | 'loading'
 }
}

type ListRelationshipContext = {
  getRelationships: (docs: {
    relationTo: string,
    value: number | string
  }[]) => void;
  documents: Documents
}

const Context = createContext({} as ListRelationshipContext);

export const RelationshipProvider: React.FC<{children?: React.ReactNode}> = ({ children }) => {
  const [documents, dispatchDocuments] = useReducer(reducer, {});
  const debouncedDocuments = useDebounce(documents, 100);
  const config = useConfig();
  const {
    serverURL,
    routes: { api },
  } = config;

  useEffect(() => {
    Object.entries(debouncedDocuments).forEach(([slug, docs]) => {
      const idsToLoad: (string | number)[] = [];

      Object.entries(docs).forEach(([id, value]) => {
        if (value === null) {
          idsToLoad.push(id);
        }
      });

      if (idsToLoad.length > 0) {
        const url = `${serverURL}${api}/${slug}`;
        const params = {
          depth: 0,
          'where[id][in]': idsToLoad,
          pagination: false,
        };

        const query = querystring.stringify(params, { addQueryPrefix: true });
        requests.get(`${url}${query}`).then(async (res) => {
          const result = await res.json();
          if (result.docs) {
            dispatchDocuments({ type: 'ADD_LOADED', docs: result.docs, relationTo: slug });
          }
        });
      }
    });
  }, [serverURL, api, debouncedDocuments]);

  const getRelationships = useCallback(async (relationships: { relationTo: string, value: number | string }[]) => {
    dispatchDocuments({ type: 'REQUEST', docs: relationships });
  }, []);

  return (
    <Context.Provider value={{ getRelationships, documents }}>
      {children}
    </Context.Provider>
  );
};

export const useListRelationships = (): ListRelationshipContext => useContext(Context);

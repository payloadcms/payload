import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import querystring from 'qs';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../utilities/Config';
import { TypeWithID } from '../../../../../../collections/config/types';
import { reducer } from './reducer';
import useDebounce from '../../../../../hooks/useDebounce';

// documents are first set to null when requested
// set to false when no doc is returned
// or set to the document returned
export type Documents = {
  [slug: string]: {
    [id: string | number]: TypeWithID | null | false
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

export const RelationshipProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [documents, dispatchDocuments] = useReducer(reducer, {});
  const debouncedDocuments = useDebounce(documents, 100);
  const config = useConfig();
  const { i18n } = useTranslation();
  const {
    serverURL,
    routes: { api },
  } = config;

  useEffect(() => {
    Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
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
          locale: i18n.language,
          limit: 250,
        };

        const query = querystring.stringify(params, { addQueryPrefix: true });
        const result = await fetch(`${url}${query}`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        });
        if (result.ok) {
          const json = await result.json();
          if (json.docs) {
            dispatchDocuments({ type: 'ADD_LOADED', docs: json.docs, relationTo: slug, idsToLoad });
          }
        } else {
          dispatchDocuments({ type: 'ADD_LOADED', docs: [], relationTo: slug, idsToLoad });
        }
      }
    });
  }, [i18n, serverURL, api, debouncedDocuments]);

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

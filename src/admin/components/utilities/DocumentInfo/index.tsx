import React, {
  createContext, useContext, useRef,
} from 'react';
import { usePreferences } from '../Preferences';

type CollectionDoc = {
  type: 'collection'
  slug: string
  id?: string
}

type GlobalDoc = {
  type: 'global'
  slug: string
}

type ContextType = (CollectionDoc | GlobalDoc) & {
  preferencesKey?: string
}

const Context = createContext({} as ContextType);

export const DocumentInfoProvider: React.FC<CollectionDoc | GlobalDoc> = (props) => {
  const { children, type, slug } = props;
  const prevKey = useRef('undefined');
  const { movePreference } = usePreferences();

  if (type === 'global') {
    return (
      <Context.Provider value={{
        type,
        slug: props.slug,
        preferencesKey: `global-${slug}`,
      }}
      >
        {children}
      </Context.Provider>
    );
  }

  if (type === 'collection') {
    const { id } = props as CollectionDoc;

    const value: ContextType = {
      type,
      slug,
      preferencesKey: 'undefined',
    };

    if (id) {
      value.id = id;
      value.preferencesKey = `collection-${slug}-${id}`;
      if (prevKey.current === 'undefined') {
        movePreference('undefined', value.preferencesKey);
      }
    } else {
      prevKey.current = 'undefined';
    }

    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    );
  }

  return null;
};

export const useDocumentInfo = (): ContextType => useContext(Context);

export default Context;

import React, {
  createContext, useContext,
} from 'react';

type BaseType = {
  preferencesKey: string
}

type CollectionDoc = {
  type: 'collection'
  slug: string
  id: string
} & BaseType

type GlobalDoc = {
  type: 'global'
  slug: string
} & BaseType

type ContextType = CollectionDoc | GlobalDoc

const Context = createContext({} as ContextType);

export const DocumentInfoProvider: React.FC<ContextType> = (props) => {
  const { children, type, slug } = props;

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

    return (
      <Context.Provider value={{
        type,
        id,
        slug,
        preferencesKey: `collection-${slug}-${id}`,
      }}
      >
        {children}
      </Context.Provider>
    );
  }

  return null;
};

export const useDocumentInfo = (): ContextType => useContext(Context);

export default Context;

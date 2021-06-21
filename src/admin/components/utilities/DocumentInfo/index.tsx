import React, {
  createContext, useContext,
} from 'react';

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
    };

    if (id) {
      value.id = id;
      value.preferencesKey = `collection-${slug}-${id}`;
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

import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
import { useConfig } from '@payloadcms/config-provider';
import qs from 'qs';
import { PaginatedDocs } from '../../../../mongoose/types';
import { ContextType, Props, Version } from './types';
import { TypeWithID } from '../../../../globals/config/types';
import { TypeWithTimestamps } from '../../../../collections/config/types';

const Context = createContext({} as ContextType);

export const DocumentInfoProvider: React.FC<Props> = ({
  children,
  global,
  collection,
  id,
}) => {
  const { serverURL, routes: { api } } = useConfig();
  const [publishedDoc, setPublishedDoc] = useState<TypeWithID & TypeWithTimestamps>(null);
  const [versions, setVersions] = useState<PaginatedDocs<Version>>(null);
  const [unpublishedVersions, setUnpublishedVersions] = useState<PaginatedDocs<Version>>(null);

  const baseURL = `${serverURL}${api}`;
  let slug;
  let type;
  let preferencesKey;

  if (global) {
    slug = global.slug;
    type = 'global';
    preferencesKey = `global-${slug}`;
  }

  if (collection) {
    slug = collection.slug;
    type = 'collection';

    if (id) {
      preferencesKey = `collection-${slug}-${id}`;
    }
  }

  const getVersions = useCallback(async () => {
    let versionFetchURL;
    let publishedFetchURL;
    let shouldFetchVersions = false;
    let unpublishedVersionJSON = null;
    let versionJSON = null;
    let shouldFetch = true;

    const params = {
      where: {
        and: [],
      },
      depth: 0,
    };

    if (global) {
      shouldFetchVersions = Boolean(global?.versions);
      versionFetchURL = `${baseURL}/globals/${global.slug}/versions?depth=0`;
      publishedFetchURL = `${baseURL}/globals/${global.slug}?depth=0&where[_status][equals]=published`;
    }

    if (collection) {
      shouldFetchVersions = Boolean(collection?.versions);
      versionFetchURL = `${baseURL}/${collection.slug}/versions?where[parent][equals]=${id}&depth=0`;
      publishedFetchURL = `${baseURL}/${collection.slug}?where[id][equals]=${id}&depth=0&where[_status][equals]=published`;

      if (!id) {
        shouldFetch = false;
      }

      params.where.and.push({
        parent: {
          equals: id,
        },
      });
    }

    if (shouldFetch) {
      let publishedJSON = await fetch(publishedFetchURL).then((res) => res.json());

      if (collection) {
        publishedJSON = publishedJSON?.docs?.[0];
      }

      if (shouldFetchVersions) {
        versionJSON = await fetch(versionFetchURL).then((res) => res.json());

        if (publishedJSON?.updatedAt) {
          const newerVersionParams = {
            ...params,
            where: {
              ...params.where,
              and: [
                ...params.where.and,
                {
                  updatedAt: {
                    greater_than: publishedJSON?.updatedAt,
                  },
                },
              ],
            },
          };

          // Get any newer versions available
          const newerVersionRes = await fetch(`${versionFetchURL}?${qs.stringify(newerVersionParams)}`);

          if (newerVersionRes.status === 200) {
            unpublishedVersionJSON = await newerVersionRes.json();
          }
        }
      }

      setPublishedDoc(publishedJSON);
      setVersions(versionJSON);
      setUnpublishedVersions(unpublishedVersionJSON);
    }
  }, [global, collection, id, baseURL]);

  useEffect(() => {
    getVersions();
  }, [getVersions]);

  const value = {
    slug,
    type,
    preferencesKey,
    global,
    collection,
    versions,
    unpublishedVersions,
    getVersions,
    publishedDoc,
    id,
  };

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
};

export const useDocumentInfo = (): ContextType => useContext(Context);

export default Context;

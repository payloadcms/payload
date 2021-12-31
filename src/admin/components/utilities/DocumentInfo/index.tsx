import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
import { useConfig } from '@payloadcms/config-provider';
import qs from 'qs';
import { PaginatedDocs } from '../../../../mongoose/types';
import { ContextType, Props, Version } from './types';
import { TypeWithID } from '../../../../globals/config/types';

const Context = createContext({} as ContextType);

export const DocumentInfoProvider: React.FC<Props> = ({
  children,
  global,
  collection,
  id,
}) => {
  const { serverURL, routes: { api } } = useConfig();
  const [publishedDoc, setPublishedDoc] = useState<TypeWithID>(null);
  const [versions, setVersions] = useState<PaginatedDocs<Version>>(null);
  const [unpublishedVersions, setUnpublishedVersions] = useState<PaginatedDocs<Version>>(null);

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
    const baseURL = `${serverURL}${api}`;
    let versionFetchURL;
    let publishedFetchURL;
    let shouldFetch = false;
    let hasDrafts = false;

    const params = {
      where: {
        and: [],
      },
      depth: 0,
    };

    if (global) {
      shouldFetch = Boolean(global?.versions);
      hasDrafts = Boolean(global?.versions?.drafts);
      versionFetchURL = `${baseURL}/globals/${global.slug}/versions`;
      publishedFetchURL = `${baseURL}/globals/${global.slug}`;
    }

    if (collection) {
      shouldFetch = Boolean(collection?.versions);
      hasDrafts = Boolean(collection?.versions?.drafts);
      versionFetchURL = `${baseURL}/${collection.slug}/versions`;
      publishedFetchURL = `${baseURL}/${collection.slug}/${id}`;

      params.where.and.push({
        parent: {
          equals: id,
        },
      });
    }

    if (shouldFetch) {
      let versionJSON = null;
      let unpublishedVersionJSON = null;
      let publishedJSON = null;

      const promises = [
        fetch(versionFetchURL).then(async (res) => {
          if (res.status === 200) {
            versionJSON = await res.json();
          }
        }),
      ];

      if (hasDrafts) {
        // Get the published version of the doc
        promises.push(
          fetch(`${publishedFetchURL}`).then(async (res) => {
            if (res.status === 200) {
              publishedJSON = await res.json();
            }
          }),
        );
      }

      await Promise.all(promises);

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

      setVersions(versionJSON);
      setUnpublishedVersions(unpublishedVersionJSON);
      setPublishedDoc(publishedJSON);
    }
  }, [api, global, collection, serverURL, id]);

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

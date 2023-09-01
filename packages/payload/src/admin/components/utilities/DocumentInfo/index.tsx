import qs from 'qs';
import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import type { TypeWithTimestamps } from '../../../../collections/config/types';
import type { PaginatedDocs } from '../../../../database/types';
import type { TypeWithID } from '../../../../globals/config/types';
import type { DocumentPreferences } from '../../../../preferences/types';
import type { Where } from '../../../../types';
import type { ContextType, DocumentPermissions, Props, Version } from './types';

import { useAuth } from '../Auth';
import { useConfig } from '../Config';
import { usePreferences } from '../Preferences';

const Context = createContext({} as ContextType);

export const useDocumentInfo = (): ContextType => useContext(Context);

export const DocumentInfoProvider: React.FC<Props> = ({
  children,
  collection,
  global,
  id: idFromProps,
  idFromParams: getIDFromParams,
}) => {
  const { id: idFromParams } = useParams<{id: string}>();
  const id = idFromProps || (getIDFromParams ? idFromParams : null);

  const { routes: { api }, serverURL } = useConfig();
  const { getPreference, setPreference } = usePreferences();
  const { i18n } = useTranslation();
  const { permissions } = useAuth();
  const [publishedDoc, setPublishedDoc] = useState<TypeWithID & TypeWithTimestamps>(null);
  const [versions, setVersions] = useState<PaginatedDocs<Version>>(null);
  const [unpublishedVersions, setUnpublishedVersions] = useState<PaginatedDocs<Version>>(null);
  const [docPermissions, setDocPermissions] = useState<DocumentPermissions>(null);

  const baseURL = `${serverURL}${api}`;
  let slug: string;
  let pluralType: 'collections' | 'globals';
  let preferencesKey: string;

  if (global) {
    slug = global.slug;
    pluralType = 'globals';
    preferencesKey = `global-${slug}`;
  }

  if (collection) {
    slug = collection.slug;
    pluralType = 'collections';

    if (id) {
      preferencesKey = `collection-${slug}-${id}`;
    }
  }

  const getVersions = useCallback(async () => {
    let versionFetchURL;
    let publishedFetchURL;
    let draftsEnabled = false;
    let shouldFetchVersions = false;
    let unpublishedVersionJSON = null;
    let versionJSON = null;
    let shouldFetch = true;

    const versionParams = {
      depth: 0,
      where: {
        and: [],
      },
    };

    const publishedVersionParams: { depth: number, where: Where } = {
      depth: 0,
      where: {
        and: [
          {
            or: [
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                _status: {
                  exists: false,
                },
              },
            ],
          },
        ],
      },
    };

    if (global) {
      draftsEnabled = Boolean(global?.versions?.drafts);
      shouldFetchVersions = Boolean(global?.versions);
      versionFetchURL = `${baseURL}/globals/${global.slug}/versions`;
      publishedFetchURL = `${baseURL}/globals/${global.slug}?${qs.stringify(publishedVersionParams)}`;
    }

    if (collection) {
      draftsEnabled = Boolean(collection?.versions?.drafts);
      shouldFetchVersions = Boolean(collection?.versions);
      versionFetchURL = `${baseURL}/${collection.slug}/versions`;

      publishedVersionParams.where.and.push({
        id: {
          equals: id,
        },
      });

      publishedFetchURL = `${baseURL}/${collection.slug}?${qs.stringify(publishedVersionParams)}`;

      if (!id) {
        shouldFetch = false;
      }

      versionParams.where.and.push({
        parent: {
          equals: id,
        },
      });
    }

    if (shouldFetch) {
      let publishedJSON;

      if (draftsEnabled) {
        publishedJSON = await fetch(publishedFetchURL, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        }).then((res) => res.json());

        if (collection) {
          publishedJSON = publishedJSON?.docs?.[0];
        }
      }

      if (shouldFetchVersions) {
        versionJSON = await fetch(`${versionFetchURL}?${qs.stringify(versionParams)}`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        }).then((res) => res.json());

        if (publishedJSON?.updatedAt) {
          const newerVersionParams = {
            ...versionParams,
            where: {
              ...versionParams.where,
              and: [
                ...versionParams.where.and,
                {
                  updatedAt: {
                    greater_than: publishedJSON?.updatedAt,
                  },
                },
              ],
            },
          };

          // Get any newer versions available
          const newerVersionRes = await fetch(`${versionFetchURL}?${qs.stringify(newerVersionParams)}`, {
            credentials: 'include',
            headers: {
              'Accept-Language': i18n.language,
            },
          });

          if (newerVersionRes.status === 200) {
            unpublishedVersionJSON = await newerVersionRes.json();
          }
        }
      }

      setPublishedDoc(publishedJSON);
      setVersions(versionJSON);
      setUnpublishedVersions(unpublishedVersionJSON);
    }
  }, [i18n, global, collection, id, baseURL]);

  const getDocPermissions = React.useCallback(async () => {
    let docAccessURL: string;
    if (pluralType === 'globals') {
      docAccessURL = `/globals/${slug}/access`;
    } else if (pluralType === 'collections' && id) {
      docAccessURL = `/${slug}/access/${id}`;
    }

    if (docAccessURL) {
      const res = await fetch(`${serverURL}${api}${docAccessURL}`, {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
      });
      const json = await res.json();
      setDocPermissions(json);
    } else {
      // fallback to permissions from the entity type
      // (i.e. create has no id)
      setDocPermissions(permissions[pluralType][slug]);
    }
  }, [serverURL, api, pluralType, slug, id, permissions, i18n.language]);

  const getDocPreferences = useCallback(async () => {
    return getPreference<DocumentPreferences>(preferencesKey);
  }, [getPreference, preferencesKey]);

  const setDocFieldPreferences = useCallback<ContextType['setDocFieldPreferences']>(async (path, fieldPreferences) => {
    const allPreferences = await getDocPreferences();

    if (preferencesKey) {
      setPreference(preferencesKey, {
        ...allPreferences,
        fields: {
          ...(allPreferences?.fields || {}),
          [path]: {
            ...allPreferences?.fields?.[path],
            ...fieldPreferences,
          },
        },
      });
    }
  }, [setPreference, preferencesKey, getDocPreferences]);

  useEffect(() => {
    getVersions();
  }, [getVersions]);

  useEffect(() => {
    getDocPermissions();
  }, [getDocPermissions]);

  const value: ContextType = {
    collection,
    docPermissions,
    getDocPermissions,
    getDocPreferences,
    getVersions,
    global,
    id,
    preferencesKey,
    publishedDoc,
    setDocFieldPreferences,
    slug,
    unpublishedVersions,
    versions,
  };

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
};

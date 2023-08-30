import queryString from 'qs';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

import type { Field } from '../../../../../fields/config/types.js';
import type { ListIndexProps, ListPreferences, Props } from './types.js';

import usePayloadAPI from '../../../../hooks/usePayloadAPI.js';
import { useStepNav } from '../../../elements/StepNav/index.js';
import { TableColumnsProvider } from '../../../elements/TableColumns/index.js';
import { useAuth } from '../../../utilities/Auth/index.js';
import { useConfig } from '../../../utilities/Config/index.js';
import { usePreferences } from '../../../utilities/Preferences/index.js';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent/index.js';
import { useSearchParams } from '../../../utilities/SearchParams/index.js';
import DefaultList from './Default.js';
import formatFields from './formatFields.js';

/**
 * The ListView component is table which lists the collection's documents.
 * The default list view can be found at the {@link DefaultList} component.
 * Users can also create pass their own custom list view component instead
 * of using the default one.
 */
const ListView: React.FC<ListIndexProps> = (props) => {
  const {
    collection,
    collection: {
      admin: {
        components: {
          views: {
            List: CustomList,
          } = {},
        } = {},
        pagination: {
          defaultLimit,
        },
      },
      labels: {
        plural,
      },
      slug,
    },
  } = props;

  const { routes: { admin, api }, serverURL } = useConfig();
  const preferenceKey = `${collection.slug}-list`;
  const { permissions } = useAuth();
  const { setStepNav } = useStepNav();
  const { getPreference, setPreference } = usePreferences();
  const { limit, page, sort, where } = useSearchParams();
  const history = useHistory();
  const { t } = useTranslation('general');
  const [fetchURL, setFetchURL] = useState<string>('');
  const [fields] = useState<Field[]>(() => formatFields(collection));
  const collectionPermissions = permissions?.collections?.[slug];
  const hasCreatePermission = collectionPermissions?.create?.permission;
  const newDocumentURL = `${admin}/collections/${slug}/create`;
  const [{ data }, { setParams }] = usePayloadAPI(fetchURL, { initialParams: { page: 1 } });

  useEffect(() => {
    setStepNav([
      {
        label: plural,
      },
    ]);
  }, [setStepNav, plural]);

  // /////////////////////////////////////
  // Set up Payload REST API query params
  // /////////////////////////////////////

  const resetParams = useCallback<Props['resetParams']>((overrides = {}) => {
    const params: Record<string, unknown> = {
      depth: 0,
      draft: 'true',
      limit,
      page: overrides?.page,
      sort: overrides?.sort,
      where: overrides?.where,
    };

    if (page) params.page = page;
    if (sort) params.sort = sort;
    if (where) params.where = where;
    params.invoke = uuid();

    setParams(params);
  }, [limit, page, setParams, sort, where]);

  useEffect(() => {
    // Performance enhancement
    // Setting the Fetch URL this way
    // prevents a double-fetch
    setFetchURL(`${serverURL}${api}/${slug}`);
    resetParams();
  }, [api, resetParams, serverURL, slug]);

  // /////////////////////////////////////
  // Fetch preferences on first load
  // /////////////////////////////////////

  useEffect(() => {
    (async () => {
      const currentPreferences = await getPreference<ListPreferences>(preferenceKey);

      const params = queryString.parse(history.location.search, { depth: 0, ignoreQueryPrefix: true });

      const search = {
        ...params,
        limit: params?.limit || currentPreferences?.limit || defaultLimit,
        sort: params?.sort || currentPreferences?.sort,
      };

      const newSearchQuery = queryString.stringify(search, { addQueryPrefix: true });

      if (newSearchQuery.length > 1) {
        history.replace({
          search: newSearchQuery,
        });
      }
    })();
  }, [collection, getPreference, preferenceKey, history, t, defaultLimit]);

  // /////////////////////////////////////
  // Set preferences on change
  // /////////////////////////////////////

  useEffect(() => {
    (async () => {
      const currentPreferences = await getPreference<ListPreferences>(preferenceKey);

      const newPreferences = {
        ...currentPreferences,
        limit,
        sort,
      };

      setPreference(preferenceKey, newPreferences);
    })();
  }, [sort, limit, preferenceKey, setPreference, getPreference]);

  // /////////////////////////////////////
  // Prevent going beyond page limit
  // /////////////////////////////////////

  useEffect(() => {
    if (data?.totalDocs && data.pagingCounter > data.totalDocs) {
      const params = queryString.parse(history.location.search, {
        depth: 0,
        ignoreQueryPrefix: true,
      });
      const newSearchQuery = queryString.stringify({
        ...params,
        page: data.totalPages,
      }, { addQueryPrefix: true });
      history.replace({
        search: newSearchQuery,
      });
    }
  }, [data, history, resetParams]);

  return (
    <TableColumnsProvider collection={collection}>
      <RenderCustomComponent
        componentProps={{
          collection: { ...collection, fields },
          data,
          hasCreatePermission,
          limit: limit || defaultLimit,
          newDocumentURL,
          resetParams,
        }}
        CustomComponent={CustomList}
        DefaultComponent={DefaultList}
      />
    </TableColumnsProvider>
  );
};

export default ListView;

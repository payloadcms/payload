import { v4 as uuid } from 'uuid';
import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'qs';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../utilities/Config';
import { useAuth } from '../../../utilities/Auth';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import DefaultList from './Default';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import { useStepNav } from '../../../elements/StepNav';
import formatFields from './formatFields';
import { Props, ListIndexProps, ListPreferences } from './types';
import { usePreferences } from '../../../utilities/Preferences';
import { useSearchParams } from '../../../utilities/SearchParams';
import { TableColumnsProvider } from '../../../elements/TableColumns';
import type { Field } from '../../../../../fields/config/types';

const ListView: React.FC<ListIndexProps> = (props) => {
  const {
    collection,
    collection: {
      slug,
      labels: {
        plural,
      },
      admin: {
        pagination: {
          defaultLimit,
        },
        components: {
          views: {
            List: CustomList,
          } = {},
        } = {},
      },
    },
  } = props;

  const { serverURL, routes: { api, admin } } = useConfig();
  const preferenceKey = `${collection.slug}-list`;
  const { permissions } = useAuth();
  const { setStepNav } = useStepNav();
  const { getPreference, setPreference } = usePreferences();
  const { page, sort, limit, where } = useSearchParams();
  const history = useHistory();
  const { t } = useTranslation('general');
  const [fetchURL, setFetchURL] = useState<string>('');
  const [fields] = useState<Field[]>(() => formatFields(collection, t));
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
      page: overrides?.page,
      sort: overrides?.sort,
      where: overrides?.where,
      limit,
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

      const params = queryString.parse(history.location.search, { ignoreQueryPrefix: true, depth: 0 });

      const search = {
        ...params,
        sort: params?.sort || currentPreferences?.sort,
        limit: params?.limit || currentPreferences?.limit || defaultLimit,
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
        ignoreQueryPrefix: true,
        depth: 0,
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
        DefaultComponent={DefaultList}
        CustomComponent={CustomList}
        componentProps={{
          collection: { ...collection, fields },
          newDocumentURL,
          hasCreatePermission,
          data,
          limit: limit || defaultLimit,
          resetParams,
        }}
      />
    </TableColumnsProvider>
  );
};

export default ListView;

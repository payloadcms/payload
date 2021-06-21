import React, { useEffect, useState } from 'react';
import queryString from 'qs';
import { useLocation } from 'react-router-dom';
import { useConfig, useAuth } from '@payloadcms/config-provider';

import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import DefaultList from './Default';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import { useStepNav } from '../../../elements/StepNav';
import { ListControls } from '../../../elements/ListControls/types';
import formatFields from './formatFields';
import buildColumns from './buildColumns';
import { ListIndexProps } from './types';
import { usePreferences } from '../../../utilities/Preferences';

const ListView: React.FC<ListIndexProps> = (props) => {
  const {
    collection,
    collection: {
      slug,
      labels: {
        plural,
      },
      admin: {
        components: {
          views: {
            List: CustomList,
          } = {},
        } = {},
      },
    },
  } = props;

  const { serverURL, routes: { api, admin } } = useConfig();
  const { permissions } = useAuth();
  const location = useLocation();
  const { setStepNav } = useStepNav();
  const { getPreference, setPreference } = usePreferences();

  const [fields] = useState(() => formatFields(collection));
  const [listControls, setListControls] = useState<ListControls>({});
  const [columns, setColumns] = useState([]);
  const [sort, setSort] = useState(null);

  const collectionPermissions = permissions?.collections?.[slug];
  const hasCreatePermission = collectionPermissions?.create?.permission;

  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });
  const newDocumentURL = `${admin}/collections/${slug}/create`;
  const apiURL = `${serverURL}${api}/${slug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, { initialParams: { depth: 0 } });

  const { columns: listControlsColumns } = listControls;

  useEffect(() => {
    const params = {
      depth: 1,
      page: undefined,
      sort: undefined,
      where: undefined,
    };

    if (page) params.page = page;
    if (sort) params.sort = sort;
    if (listControls?.where) params.where = listControls.where;

    setParams(params);
  }, [setParams, page, sort, listControls]);

  useEffect(() => {
    setStepNav([
      {
        label: plural,
      },
    ]);
  }, [setStepNav, plural]);

  useEffect(() => {
    (async () => {
      const columnPreferences = await getPreference<string[]>(`${collection.slug}-list-columns`);
      setColumns(buildColumns(collection, columnPreferences || listControlsColumns, setSort));
    })();
  }, [collection, listControlsColumns, setSort, getPreference]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultList}
      CustomComponent={CustomList}
      componentProps={{
        collection: { ...collection, fields },
        newDocumentURL,
        hasCreatePermission,
        setSort,
        setListControls,
        listControls,
        data,
        columns,
      }}
    />
  );
};

export default ListView;

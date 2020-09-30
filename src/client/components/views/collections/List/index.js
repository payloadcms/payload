import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import queryString from 'qs';
import { useLocation } from 'react-router-dom';
import { useConfig } from '../../../providers/Config';
import { useAuthentication } from '../../../providers/Authentication';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import DefaultList from './Default';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import { useStepNav } from '../../../elements/StepNav';
import formatFields from './formatFields';
import buildColumns from './buildColumns';

const ListView = (props) => {
  const {
    collection,
    collection: {
      slug,
      labels: {
        plural,
      },
      admin: {
        components: {
          List: CustomList,
        } = {},
      },
    },
  } = props;

  const { serverURL, routes: { api, admin } } = useConfig();
  const { permissions } = useAuthentication();
  const location = useLocation();
  const { setStepNav } = useStepNav();

  const [fields] = useState(() => formatFields(collection));
  const [listControls, setListControls] = useState({});
  const [columns, setColumns] = useState([]);
  const [sort, setSort] = useState(null);

  const collectionPermissions = permissions?.[slug];
  const hasCreatePermission = collectionPermissions?.create?.permission;

  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });
  const newDocumentURL = `${admin}/collections/${slug}/create`;
  const apiURL = `${serverURL}${api}/${slug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, { initialParams: { depth: 0 } });

  const { columns: listControlsColumns } = listControls;

  useEffect(() => {
    const params = {
      depth: 1,
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
    setColumns(buildColumns(collection, listControlsColumns, setSort));
  }, [collection, listControlsColumns, setSort]);

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

ListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
      plural: PropTypes.string,
    }),
    admin: PropTypes.shape({
      components: PropTypes.shape({
        List: PropTypes.node,
      }),
    }),
    slug: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape),
    timestamps: PropTypes.bool,
  }).isRequired,
};

export default ListView;

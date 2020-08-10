import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import queryString from 'qs';
import { useLocation } from 'react-router-dom';
import config from 'payload/config';
import { useUser } from '../../../data/User';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import DefaultList from './Default';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import { useStepNav } from '../../../elements/StepNav';
import formatFields from './formatFields';

const { serverURL, routes: { api, admin } } = config;

const ListView = (props) => {
  const {
    collection,
    collection: {
      slug,
      labels: {
        plural,
      },
    },
  } = props;

  const { permissions } = useUser();
  const location = useLocation();
  const { setStepNav } = useStepNav();

  const [fields] = useState(() => formatFields(collection));
  const [listControls, setListControls] = useState({});
  const [sort, setSort] = useState(null);

  const collectionPermissions = permissions?.[slug];
  const hasCreatePermission = collectionPermissions?.create?.permission;

  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });
  const newDocumentURL = `${admin}/collections/${slug}/create`;
  const apiURL = `${serverURL}${api}/${slug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, { initialParams: { depth: 0 } });

  useEffect(() => {
    const params = {
      depth: 2,
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

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultList}
      path={`${slug}.views.List`}
      componentProps={{
        collection: { ...collection, fields },
        newDocumentURL,
        hasCreatePermission,
        setSort,
        setListControls,
        listControls,
        data,
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
    slug: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape),
    timestamps: PropTypes.bool,
  }).isRequired,
};

export default ListView;

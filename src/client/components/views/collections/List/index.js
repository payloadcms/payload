import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import customComponents from '../../../customComponents';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Paginator from '../../../elements/Paginator';
import ListControls from '../../../elements/ListControls';

import './index.scss';

const { serverURL, routes: { api, admin } } = PAYLOAD_CONFIG;

const baseClass = 'collection-list';

const DefaultList = (props) => {
  const {
    collection,
    collection: {
      slug,
      labels: {
        plural: pluralLabel,
      },
    },
  } = props;

  const location = useLocation();
  const [listControls, setListControls] = useState({});

  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });

  const apiURL = `${serverURL}${api}/${slug}`;

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {});

  useEffect(() => {
    const params = {};

    if (page) params.page = page;
    if (listControls?.where) params.where = listControls.where;

    setParams(params);
  }, [setParams, page, listControls]);

  return (
    <div className={baseClass}>
      <h1>{pluralLabel}</h1>
      <ListControls
        handleChange={setListControls}
        collection={collection}
      />
      {(data.docs && data.docs.length > 0) && (
        <ul>
          {data.docs.map((doc) => {
            return (
              <li key={doc.id}>
                <Link to={`${admin}/collections/${collection.slug}/${doc.id}`}>
                  {doc[collection.useAsTitle || 'id']}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {(!data.docs || data.docs.length === 0) && (
        <div className={`${baseClass}__no-results`}>
          No
          {' '}
          {pluralLabel}
          {' '}
          found
        </div>
      )}
      <Paginator
        totalDocs={data.totalDocs}
        limit={data.limit}
        totalPages={data.totalPages}
        page={data.page}
        hasPrevPage={data.hasPrevPage}
        hasNextPage={data.hasNextPage}
        prevPage={data.prevPage}
        nextPage={data.nextPage}
        numberOfNeighbors={1}
      />
    </div>
  );
};

DefaultList.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape),
  }).isRequired,
};

const ListView = (props) => {
  const { collection } = props;
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([
      {
        label: collection.labels.plural,
      },
    ]);
  }, [setStepNav, collection.labels.plural]);

  const List = customComponents?.[collection.slug]?.views?.List || DefaultList;

  return (
    <>
      <List collection={collection} />
    </>
  );
};

ListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
  }).isRequired,
};

export default ListView;

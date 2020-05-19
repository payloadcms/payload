import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import customComponents from '../../../customComponents';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Paginator from '../../../elements/Paginator';

import './index.scss';

const { serverURL, routes: { api, admin } } = PAYLOAD_CONFIG;

const DefaultList = (props) => {
  const { collection, data } = props;

  return (
    <div className="collection-list">
      {data.docs && (
        <ul>
          {data.docs.map((doc) => {
            return (
              <li key={doc.id}>
                <Link to={`${admin}/collections/${collection.slug}/${doc.id}`}>
                  {doc.id}
                </Link>
              </li>
            );
          })}
        </ul>
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

DefaultList.defaultProps = {
  data: undefined,
};

DefaultList.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
  }).isRequired,
  data: PropTypes.shape({
    docs: PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
    totalDocs: PropTypes.number,
    prevPage: PropTypes.number,
    nextPage: PropTypes.number,
    hasNextPage: PropTypes.bool,
    hasPrevPage: PropTypes.bool,
    limit: PropTypes.number,
    page: PropTypes.number,
    totalPages: PropTypes.number,
  }),
};

const ListView = (props) => {
  const { collection } = props;
  const location = useLocation();
  const { setStepNav } = useStepNav();
  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });

  const apiURL = [
    `${serverURL}${api}/${collection.slug}`,
    page && `?page=${page}&`,
  ].filter(Boolean).join('');

  const [{ data }] = usePayloadAPI(apiURL);

  useEffect(() => {
    setStepNav([
      {
        label: collection.labels.plural,
      },
    ]);
  }, [setStepNav, collection.labels.plural]);

  const List = customComponents?.[collection.slug]?.views?.List || DefaultList;

  return (
    <List
      data={data}
      collection={collection}
    />
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

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import config from '../../../../securedConfig';
import Paginator from '../../../elements/Paginator';

import './index.scss';

const { serverURL, routes: { api } } = config;

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

  return (
    <div className="collection-list">
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

ListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
  }).isRequired,
};

export default ListView;

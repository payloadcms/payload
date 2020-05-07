import React from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import config from '../../../../securedConfig';
import DefaultTemplate from '../../../templates/Default';
import Paginator from '../../../elements/Paginator';

import './index.scss';

const { serverURL, routes: { api } } = config;

const ListView = (props) => {
  const { collection } = props;
  const location = useLocation();
  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });

  const apiURL = [
    `${serverURL}${api}/${collection.slug}`,
    page && `?page=${page}&`,
  ].filter(Boolean).join('');

  const [{ data }] = usePayloadAPI(apiURL);

  return (
    <DefaultTemplate
      className="collection-list"
      stepNav={[
        {
          label: collection.labels.plural,
        },
      ]}
    >
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
    </DefaultTemplate>
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

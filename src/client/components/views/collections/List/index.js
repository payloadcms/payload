import React from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'qs';
import PropTypes from 'prop-types';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';
import HeadingButton from '../../../modules/HeadingButton';
import SearchableTable from '../../../modules/SearchableTable';
import Pagination from '../../../modules/Paginator';

import './index.scss';

const {
  serverURL,
  routes: {
    admin,
  },
} = getSanitizedConfig();

const ListView = (props) => {
  const { collection } = props;
  const location = useLocation();
  const { page } = queryString.parse(location.search, { ignoreQueryPrefix: true });

  const apiURL = [
    `${serverURL}/${collection.slug}?`,
    page && `page=${page}&`,
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
      <HeadingButton
        heading={collection.labels.plural}
        buttonLabel="Add New"
        buttonURL={`${admin}/collections/${collection.slug}/create`}
        buttonType="link"
      />
      <SearchableTable
        data={data.docs}
        collection={collection}
      />
      <Pagination
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

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';
import HeadingButton from '../../../modules/HeadingButton';
import SearchableTable from '../../../modules/SearchableTable';
import Pagination from '../../../modules/Pagination';

import './index.scss';

const {
  serverURL,
  routes: {
    admin,
  },
} = getSanitizedConfig();

const ListView = (props) => {
  const { collection } = props;
  const [page, setPage] = useState(null);

  const apiURL = [
    `${serverURL}/${collection.slug}?`,
    page !== null && `page=${page}&`,
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
        setPage={setPage}
        totalDocs={data.totalDocs}
        limit={data.limit}
        totalPages={data.totalPages}
        page={data.page}
        pagingCounter={data.pagingCounter}
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

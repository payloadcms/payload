import React from 'react';
import PropTypes from 'prop-types';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';
import HeadingButton from '../../../modules/HeadingButton';
import SearchableTable from '../../../modules/SearchableTable';

import './index.scss';

const {
  serverURL,
  routes: {
    admin,
  },
} = getSanitizedConfig();

const ListView = (props) => {
  const { collection } = props;

  const [{ data }] = usePayloadAPI(
    `${serverURL}/${collection.slug}`,
  );

  console.log(data);

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

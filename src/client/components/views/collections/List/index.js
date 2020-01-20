import React from 'react';
import PropTypes from 'prop-types';
import DefaultTemplate from '../../../layout/DefaultTemplate';

import './index.scss';

const ListView = (props) => {
  const { collection } = props;

  return (
    <DefaultTemplate
      className="collection-list"
      stepNav={[
        {
          label: collection.labels.plural,
        },
      ]}
    >
      <h1>{collection.labels.plural}</h1>
    </DefaultTemplate>
  );
};

ListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
  }).isRequired,
};

export default ListView;

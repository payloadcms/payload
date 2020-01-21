import React from 'react';
import PropTypes from 'prop-types';
import DefaultTemplate from 'payload/client/components/layout/DefaultTemplate';

import './index.scss';

const PageListView = (props) => {
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
      <p>This is a custom Pages list view</p>
    </DefaultTemplate>
  );
};

PageListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
  }).isRequired,
};

export default PageListView;

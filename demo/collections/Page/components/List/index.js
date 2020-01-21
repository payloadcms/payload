import React from 'react';
import PropTypes from 'prop-types';

const PageListView = (props) => {
  const { collection } = props;

  return (
    <>
      <h1>{collection.labels.plural}</h1>
      <p>This is a custom Pages list view</p>
    </>
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

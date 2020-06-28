import React from 'react';
import PropTypes from 'prop-types';
import { Modal, useModal } from '@trbl/react-modal';

import './index.scss';

const baseClass = 'add-upload-modal';

const AddExistingUploadModal = (props) => {
  const { closeAll, toggle } = useModal();

  const {
    collection,
    slug,
  } = props;

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <Modal
      className={classes}
      slug={slug}
    >
      <div>
        Upload new
        {' '}
        {collection.labels.singular}
      </div>
    </Modal>
  );
};

AddExistingUploadModal.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
  }).isRequired,
  slug: PropTypes.string.isRequired,
};

export default AddExistingUploadModal;

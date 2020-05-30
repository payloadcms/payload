import React from 'react';
import PropTypes from 'prop-types';
import useForm from '../../forms/Form/useForm';
import { useUser } from '../../data/User';
import Button from '../Button';

const baseClass = 'preview-btn';

const PreviewButton = ({ generatePreviewURL }) => {
  const { token } = useUser();
  const { fields } = useForm();

  const previewURL = (generatePreviewURL && typeof generatePreviewURL === 'function') ? generatePreviewURL(fields, token) : null;

  if (previewURL) {
    return (
      <Button
        el="anchor"
        className={baseClass}
        buttonStyle="secondary"
        url={previewURL}
      >
        Preview
      </Button>
    );
  }

  return null;
};

PreviewButton.defaultProps = {
  generatePreviewURL: null,
};

PreviewButton.propTypes = {
  generatePreviewURL: PropTypes.func,
};

export default PreviewButton;

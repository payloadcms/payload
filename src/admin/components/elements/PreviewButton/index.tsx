import React from 'react';
import { useAuth } from '@payloadcms/config-provider';
import Button from '../Button';
import { Props } from './types';

const baseClass = 'preview-btn';

const PreviewButton: React.FC<Props> = ({ generatePreviewURL, data }) => {
  const { token } = useAuth();

  if (generatePreviewURL && typeof generatePreviewURL === 'function') {
    const previewURL = generatePreviewURL(data, token);

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

export default PreviewButton;

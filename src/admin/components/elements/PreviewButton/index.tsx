import React from 'react';
import { useAuth } from '@payloadcms/config-provider';
import { useForm } from '../../forms/Form/context';
import Button from '../Button';
import { Props } from './types';

const baseClass = 'preview-btn';

const PreviewButton: React.FC<Props> = ({ generatePreviewURL }) => {
  const { token } = useAuth();
  const { getFields } = useForm();
  const fields = getFields();

  if (generatePreviewURL && typeof generatePreviewURL === 'function') {
    const previewURL = generatePreviewURL(fields, token);

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

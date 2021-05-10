import React from 'react';
import { useAuth } from '@payloadcms/config-provider';
import Button from '../Button';
import { Props } from './types';
import { useLocale } from '../../utilities/Locale';

const baseClass = 'preview-btn';

const PreviewButton: React.FC<Props> = ({ generatePreviewURL, data }) => {
  const locale = useLocale();
  const { token } = useAuth();

  if (generatePreviewURL && typeof generatePreviewURL === 'function') {
    const url = generatePreviewURL(data, { locale, token });

    return (
      <Button
        el="anchor"
        className={baseClass}
        buttonStyle="secondary"
        url={url}
        newTab
      >
        Preview
      </Button>
    );
  }

  return null;
};

export default PreviewButton;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utilities/Auth';
import Button from '../Button';
import { Props } from './types';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const baseClass = 'preview-btn';

const PreviewButton: React.FC<Props> = (props) => {
  const {
    generatePreviewURL,
    data,
  } = props;

  const [url, setUrl] = useState<string | undefined>(undefined);

  const locale = useLocale();
  const { token } = useAuth();

  useEffect(() => {
    if (generatePreviewURL && typeof generatePreviewURL === 'function') {
      const makeRequest = async () => {
        const previewURL = await generatePreviewURL(data, { locale, token });
        setUrl(previewURL);
      };

      makeRequest();
    }
  }, [
    generatePreviewURL,
    locale,
    token,
    data,
  ]);

  if (url) {
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

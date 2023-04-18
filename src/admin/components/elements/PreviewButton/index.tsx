import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../utilities/Auth';
import Button from '../Button';
import { Props } from './types';
import { useLocale } from '../../utilities/Locale';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useConfig } from '../../utilities/Config';

import './index.scss';

const baseClass = 'preview-btn';

const PreviewButton: React.FC<Props> = (props) => {
  const {
    generatePreviewURL,
  } = props;

  const { id, collection, global } = useDocumentInfo();

  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();
  const { token } = useAuth();
  const { serverURL, routes: { api } } = useConfig();
  const { t } = useTranslation('version');
  const isGeneratingPreviewURL = useRef(false);

  // we need to regenerate the preview URL every time the button is clicked
  // to do this we need to fetch the document data fresh from the API
  // this will ensure the latest data is used when generating the preview URL
  const handleClick = useCallback(async () => {
    if (!generatePreviewURL || isGeneratingPreviewURL.current) return;
    isGeneratingPreviewURL.current = true;

    try {
      setIsLoading(true);

      let url = `${serverURL}${api}`;
      if (collection) url = `${url}/${collection.slug}/${id}`;
      if (global) url = `${url}/globals/${global.slug}`;

      const data = await fetch(`${url}?draft=true&locale=${locale}&fallback-locale=null`).then((res) => res.json());
      const previewURL = await generatePreviewURL(data, { locale, token });
      if (!previewURL) throw new Error();
      setIsLoading(false);
      isGeneratingPreviewURL.current = false;
      window.open(previewURL, '_blank');
    } catch (err) {
      setIsLoading(false);
      isGeneratingPreviewURL.current = false;
      toast.error(t('error:previewing'));
    }
  }, [serverURL, api, collection, global, id, generatePreviewURL, locale, token, t]);

  return (
    <Button
      className={baseClass}
      buttonStyle="secondary"
      onClick={handleClick}
      disabled={isLoading || !generatePreviewURL}
    >
      {isLoading ? t('general:loading') : t('preview')}
    </Button>
  );
};

export default PreviewButton;

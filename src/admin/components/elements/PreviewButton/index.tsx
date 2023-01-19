import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

  const handleClick = useCallback(async () => {
    setIsLoading(true);

    let url = `${serverURL}${api}`;
    if (collection) url = `${url}/${collection.slug}/${id}`;
    if (global) url = `${url}/globals/${global.slug}`;

    const data = await fetch(`${url}?draft=true&locale=${locale}&fallback-locale=null`).then((res) => res.json());
    const previewURL = await generatePreviewURL(data, { locale, token });
    setIsLoading(false);

    window.open(previewURL, '_blank');
  }, [serverURL, api, collection, global, id, generatePreviewURL, locale, token]);

  return (
    <Button
      className={baseClass}
      buttonStyle="secondary"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? t('general:loading') : t('preview')}
    </Button>
  );
};

export default PreviewButton;

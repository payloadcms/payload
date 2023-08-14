import React, { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { GeneratePreviewURL } from '../../../../config/types';
import { useAuth } from '../../utilities/Auth';
import Button from '../Button';
import { useLocale } from '../../utilities/Locale';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useConfig } from '../../utilities/Config';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';

const baseClass = 'preview-btn';

export type CustomPreviewButtonProps = React.ComponentType<DefaultPreviewButtonProps & {
  DefaultButton: React.ComponentType<DefaultPreviewButtonProps>;
}>
export type DefaultPreviewButtonProps = {
  preview: () => void;
  disabled: boolean;
  label: string;
};
const DefaultPreviewButton: React.FC<DefaultPreviewButtonProps> = ({ preview, disabled, label }) => {
  return (
    <Button
      className={baseClass}
      buttonStyle="secondary"
      onClick={preview}
      disabled={disabled}
    >
      {label}
    </Button>
  );
};

type Props = {
  CustomComponent?: CustomPreviewButtonProps
  generatePreviewURL?: GeneratePreviewURL
}
const PreviewButton: React.FC<Props> = ({
  CustomComponent,
  generatePreviewURL,
}) => {
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
  const preview = useCallback(async () => {
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
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultPreviewButton}
      componentProps={{
        preview,
        disabled: isLoading || !generatePreviewURL,
        label: isLoading ? t('general:loading') : t('preview'),
        DefaultButton: DefaultPreviewButton,
      }}
    />
  );
};

export default PreviewButton;

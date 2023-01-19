import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingOverlay } from '../../utilities/LoadingOverlay';
import type { LoadingOverlayTypes } from '../../utilities/LoadingOverlay/types';

import './index.scss';

const baseClass = 'loading-overlay';

type Props = {
  show?: boolean;
  loadingText?: string;
  overlayType?: string
}
export const LoadingOverlay: React.FC<Props> = ({ loadingText, show = true, overlayType }) => {
  const { t } = useTranslation('general');

  return (
    <div
      className={[
        baseClass,
        show ? `${baseClass}--entering` : `${baseClass}--exiting`,
        overlayType ? `${baseClass}--${overlayType}` : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={`${baseClass}__bars`}>
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
      </div>

      <span className={`${baseClass}__text`}>{loadingText || t('loading')}</span>
    </div>
  );
};


type UseLoadingOverlayToggleT = {
  show: boolean;
  name: string;
  type?: LoadingOverlayTypes,
  loadingText?: string;
}
export const LoadingOverlayToggle: React.FC<UseLoadingOverlayToggleT> = ({ name: key, show, type = 'fullscreen', loadingText }) => {
  const { toggleLoadingOverlay } = useLoadingOverlay();

  React.useEffect(() => {
    toggleLoadingOverlay({
      key,
      isLoading: show,
      type,
      loadingText: loadingText || undefined,
    });

    return () => {
      toggleLoadingOverlay({
        key,
        isLoading: false,
        type,
      });
    };
  }, [show, toggleLoadingOverlay, key, type, loadingText]);

  return null;
};

import React from 'react';
import { useTranslation } from 'react-i18next';

import './index.scss';

export const FullscreenLoader: React.FC = () => {
  const baseClass = 'fullscreen-loader';
  const { t } = useTranslation('general');

  // TODO: only show after X time, possibly show for min time

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__bars`}>
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
        <div className={`${baseClass}__bar`} />
      </div>

      <span className={`${baseClass}__text`}>{t('loading')}</span>
    </div>
  );
};

const Loading: React.FC = () => {
  const baseClass = 'loading';

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__text`}>Loading...</span>
    </div>
  );
};

export default Loading;

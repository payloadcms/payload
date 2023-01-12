import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFullscreenLoader } from '../../utilities/FullscreenLoaderProvider';

import './index.scss';

const Loading: React.FC = () => {
  const baseClass = 'loading';
  const { t } = useTranslation('general');

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__text`}>
        {t('loading')}
        ...
      </span>
    </div>
  );
};

export const ForceFullscreenLoader: React.FC = () => {
  const { setShowLoader } = useFullscreenLoader();

  React.useEffect(() => {
    setShowLoader(true);

    return () => {
      setShowLoader(false);
    };
  }, [setShowLoader]);

  return null;
};

export default Loading;

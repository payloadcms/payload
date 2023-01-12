import React, {
  createContext, useContext, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDelay } from '../../../hooks/useDelay';

import './index.scss';

export type FullscreenLoaderContext = {
  showLoader: boolean
  setShowLoader: (show: boolean) => void
}

const initialContext: FullscreenLoaderContext = {
  showLoader: false,
  setShowLoader: undefined,
};

const Context = createContext(initialContext);

const delayBeforeRender = 500;
const animationDuration = 500;
const minShowTime = (animationDuration * 2) + 750;

const baseClass = 'fullscreenLoader';

export const FullscreenLoaderProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('general');

  const [showLoader, setShowLoader] = useState(false);
  const [isShowing, setIsShowing] = React.useState(false);
  const [hasDelayed, setHasDelayed] = useDelay(delayBeforeRender, showLoader);
  const [isHiding, setIsHiding] = React.useState(false);
  const [displayedAt, setDisplayedAt] = React.useState<number>();

  React.useEffect(() => {
    if (hasDelayed && showLoader && !isShowing) {
      setDisplayedAt(Date.now());
      setIsShowing(true);
    }
  }, [showLoader, isShowing, displayedAt, hasDelayed]);

  React.useEffect(() => {
    let closeTimeout: NodeJS.Timeout;
    const shouldHide = isShowing && !showLoader;

    const hide = () => {
      const timeDisplayed = Date.now() - displayedAt;
      const remainingShowTime = minShowTime - timeDisplayed;

      if (remainingShowTime > 0 && timeDisplayed < minShowTime) {
        closeTimeout = setTimeout(hide, remainingShowTime);
      } else {
        setIsHiding(true);
        closeTimeout = setTimeout(() => {
          setIsShowing(false);
          setHasDelayed(false);
          setIsHiding(false);
        }, animationDuration);
      }
    };


    if (shouldHide) {
      hide();
    }

    return () => {
      if (closeTimeout) clearTimeout(closeTimeout);
    };
  }, [showLoader, isShowing, displayedAt, setHasDelayed]);

  return (
    <Context.Provider
      value={{
        setShowLoader,
        showLoader,
      }}
    >
      {hasDelayed && isShowing && (
        <div
          className={[
            baseClass,
            isHiding ? `${baseClass}--exiting` : `${baseClass}--entering`,
          ].filter(Boolean).join(' ')}
          style={{
            animationDuration: `${animationDuration}ms`,
          }}
        >
          <div className={`${baseClass}__bars`}>
            <div className={`${baseClass}__bar`} />
            <div className={`${baseClass}__bar`} />
            <div className={`${baseClass}__bar`} />
            <div className={`${baseClass}__bar`} />
            <div className={`${baseClass}__bar`} />
          </div>

          <span className={`${baseClass}__text`}>{t('loading')}</span>
        </div>
      )}
      {children}
    </Context.Provider>
  );
};

export const useFullscreenLoader = (): FullscreenLoaderContext => useContext(Context);

export default Context;

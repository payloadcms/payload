import React from 'react';
import Router, { NextRouter } from 'next/router';

function saveScrollPos(asPath: string) {
  sessionStorage.setItem(
    `scrollPos:${asPath}`,
    JSON.stringify({
      x: window.scrollX,
      y: window.scrollY
    }),
  );
}

function restoreScrollPos(asPath: string) {
  const json = sessionStorage.getItem(`scrollPos:${asPath}`);
  const scrollPos = json ? JSON.parse(json) : undefined;
  if (scrollPos) {
    window.scrollTo(scrollPos.x, scrollPos.y);
  }
}

type NavigationScrollToProps = {
  router: NextRouter
  navigationTime: number
}

export const useNavigationScrollTo: React.FC<NavigationScrollToProps> = (props) => {
  const { router, navigationTime } = props;
  const deviceNavigated = React.useRef(false);

  React.useEffect(() => {
    if (('scrollRestoration' in window.history)) {
      window.history.scrollRestoration = 'manual';
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      saveScrollPos(router.asPath);
      // eslint-disable-next-line no-param-reassign
      delete event.returnValue;
    };

    const onRouteChangeStart = () => {
      saveScrollPos(router.asPath);

      // @ts-ignore
      document.documentElement.style['scroll-behavior'] = 'initial';
    };

    const onRouteChangeComplete = (url: string) => {
      // scroll and transition (timeout must be equal to css-transition duration)
      setTimeout(() => {
        if (url && deviceNavigated.current) {
          restoreScrollPos(url);
          deviceNavigated.current = false;
        } else {
          window.scrollTo({
            top: 0,
            left: 0,
          });
        }
        // @ts-ignore
        document.documentElement.style['scroll-behavior'] = 'smooth';
      }, navigationTime);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    Router.events.on('routeChangeStart', onRouteChangeStart);
    Router.events.on('routeChangeComplete', onRouteChangeComplete);
    Router.beforePopState(() => {
      deviceNavigated.current = true;
      return true;
    });

    // eslint-disable-next-line consistent-return
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      Router.events.off('routeChangeStart', onRouteChangeStart);
      Router.events.off('routeChangeComplete', onRouteChangeComplete);
      Router.beforePopState(() => true);
    };
  }, [router, navigationTime]);

  return null;
};

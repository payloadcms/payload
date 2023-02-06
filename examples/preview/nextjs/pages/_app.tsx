import App, { AppContext, AppProps as NextAppProps } from 'next/app';
import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import { MainMenu } from "../payload-types";
import { Header } from '../components/Header';
import { GlobalsProvider } from '../providers/Globals';
import { useNavigationScrollTo } from '../utilities/useNavigationScrollTo';
import { CookiesProvider } from 'react-cookie';

import '../css/app.scss';
export interface IGlobals {
  mainMenu: MainMenu,
}

export const getAllGlobals = async (): Promise<IGlobals> => {
  const [
    mainMenu,
  ] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/globals/main-menu?depth=1`).then((res) => res.json()),
  ]);

  return {
    mainMenu,
  }
}

const transitionTime = 500;

type AppProps<P = any> = {
  pageProps: P;
} & Omit<NextAppProps<P>, "pageProps">;

const PayloadApp = (appProps: AppProps & {
  globals: IGlobals,
}): React.ReactElement => {
  const {
    Component,
    pageProps,
    globals,
  } = appProps;

  const {
    breadcrumbs,
    collection,
    id,
    preview,
  } = pageProps;

  const router = useRouter();
  useNavigationScrollTo({
    router,
    navigationTime: transitionTime
  });

  const onPreviewExit = useCallback(() => {
    const exit = async () => {
      const exitReq = await fetch('/api/exit-preview');
      if (exitReq.status === 200) {
        router.reload();
      }
    }
    exit();
  }, [router])

  return (
    <CookiesProvider>
      <GlobalsProvider {...globals}>
        <Header
          adminBarProps={{
            collection,
            id: id,
            preview,
            onPreviewExit
          }}
        />
        <Component {...pageProps} />
      </GlobalsProvider>
    </CookiesProvider>
  )
}

PayloadApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);

  const globals = await getAllGlobals();

  return {
    ...appProps,
    globals
  };
};

export default PayloadApp

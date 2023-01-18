import App, { AppContext, AppProps } from 'next/app';
import { GridProvider } from '@faceless-ui/css-grid';
import { ModalContainer, ModalProvider } from '@faceless-ui/modal';
import React from 'react';
import { Header } from '../components/Header';
import { GlobalsProvider } from '../providers/Globals';
import { CloseModalOnRouteChange } from '../components/CloseModalOnRouteChange';
import { MainMenu } from "../payload-types";
import cssVariables from '../cssVariables';

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

const PayloadApp = (appProps: AppProps & {
  globals: IGlobals,
}): React.ReactElement => {
  const {
    Component,
    pageProps,
    globals,
  } = appProps;

  return (
    <React.Fragment>
      <GlobalsProvider {...globals}>
        <GridProvider
          breakpoints={{
            s: cssVariables.breakpoints.s,
            m: cssVariables.breakpoints.m,
            l: cssVariables.breakpoints.l,
          }}
          colGap={{
            s: '24px',
            m: '48px',
            l: '48px',
            xl: '72px',
          }}
          cols={{
            s: 4,
            m: 4,
            l: 12,
            xl: 12,
          }}
        >
          <ModalProvider
            classPrefix="form"
            transTime={0}
            zIndex="var(--modal-z-index)"
          >
            <CloseModalOnRouteChange />
            <Header />
            <Component {...pageProps} />
            <ModalContainer />
          </ModalProvider>
        </GridProvider>
      </GlobalsProvider>
    </React.Fragment>
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

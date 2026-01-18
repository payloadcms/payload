'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { ModalContainer, ModalProvider } from '@faceless-ui/modal';
import { ScrollInfoProvider } from '@faceless-ui/scroll-info';
import React from 'react';
import { CloseModalOnRouteChange } from '../../elements/CloseModalOnRouteChange/index.js';
import { LoadingOverlayProvider } from '../../elements/LoadingOverlay/index.js';
import { NavProvider } from '../../elements/Nav/context.js';
import { StayLoggedInModal } from '../../elements/StayLoggedIn/index.js';
import { StepNavProvider } from '../../elements/StepNav/index.js';
import { ClickOutsideProvider } from '../../providers/ClickOutside/index.js';
import { WindowInfoProvider } from '../../providers/WindowInfo/index.js';
import { AuthProvider } from '../Auth/index.js';
import { ClientFunctionProvider } from '../ClientFunction/index.js';
import { ConfigProvider } from '../Config/index.js';
import { DocumentEventsProvider } from '../DocumentEvents/index.js';
import { LocaleProvider } from '../Locale/index.js';
import { ParamsProvider } from '../Params/index.js';
import { PreferencesProvider } from '../Preferences/index.js';
import { RouteCache } from '../RouteCache/index.js';
import { RouteTransitionProvider } from '../RouteTransition/index.js';
import { SearchParamsProvider } from '../SearchParams/index.js';
import { ServerFunctionsProvider } from '../ServerFunctions/index.js';
import { ThemeProvider } from '../Theme/index.js';
import { ToastContainer } from '../ToastContainer/index.js';
import { TranslationProvider } from '../Translation/index.js';
import { UploadHandlersProvider } from '../UploadHandlers/index.js';
export const RootProvider = t0 => {
  const $ = _c(16);
  const {
    children,
    config,
    dateFNSKey,
    fallbackLang,
    isNavOpen,
    languageCode,
    languageOptions,
    locale,
    permissions,
    serverFunction,
    switchLanguageServerAction,
    theme,
    translations,
    user
  } = t0;
  const dndContextID = React.useId();
  let t1;
  if ($[0] !== children || $[1] !== config || $[2] !== dateFNSKey || $[3] !== dndContextID || $[4] !== fallbackLang || $[5] !== isNavOpen || $[6] !== languageCode || $[7] !== languageOptions || $[8] !== locale || $[9] !== permissions || $[10] !== serverFunction || $[11] !== switchLanguageServerAction || $[12] !== theme || $[13] !== translations || $[14] !== user) {
    t1 = _jsxs(ClickOutsideProvider, {
      children: [_jsx(ServerFunctionsProvider, {
        serverFunction,
        children: _jsx(RouteTransitionProvider, {
          children: _jsx(RouteCache, {
            cachingEnabled: process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === "true",
            children: _jsx(ConfigProvider, {
              config,
              children: _jsx(ClientFunctionProvider, {
                children: _jsx(TranslationProvider, {
                  dateFNSKey,
                  fallbackLang,
                  language: languageCode,
                  languageOptions,
                  switchLanguageServerAction,
                  translations,
                  children: _jsx(WindowInfoProvider, {
                    breakpoints: {
                      l: "(max-width: 1440px)",
                      m: "(max-width: 1024px)",
                      s: "(max-width: 768px)",
                      xs: "(max-width: 400px)"
                    },
                    children: _jsx(ScrollInfoProvider, {
                      children: _jsx(SearchParamsProvider, {
                        children: _jsxs(ModalProvider, {
                          classPrefix: "payload",
                          transTime: 0,
                          zIndex: "var(--z-modal)",
                          children: [_jsx(CloseModalOnRouteChange, {}), _jsxs(AuthProvider, {
                            permissions,
                            user,
                            children: [_jsx(PreferencesProvider, {
                              children: _jsx(ThemeProvider, {
                                theme,
                                children: _jsx(ParamsProvider, {
                                  children: _jsx(LocaleProvider, {
                                    locale,
                                    children: _jsx(StepNavProvider, {
                                      children: _jsx(LoadingOverlayProvider, {
                                        children: _jsx(DocumentEventsProvider, {
                                          children: _jsx(NavProvider, {
                                            initialIsOpen: isNavOpen,
                                            children: _jsx(UploadHandlersProvider, {
                                              children: _jsx(DndContext, {
                                                collisionDetection: pointerWithin,
                                                id: dndContextID,
                                                children
                                              })
                                            })
                                          })
                                        })
                                      })
                                    })
                                  })
                                })
                              })
                            }), _jsx(ModalContainer, {}), _jsx(StayLoggedInModal, {})]
                          })]
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }), _jsx(ToastContainer, {
        config
      })]
    });
    $[0] = children;
    $[1] = config;
    $[2] = dateFNSKey;
    $[3] = dndContextID;
    $[4] = fallbackLang;
    $[5] = isNavOpen;
    $[6] = languageCode;
    $[7] = languageOptions;
    $[8] = locale;
    $[9] = permissions;
    $[10] = serverFunction;
    $[11] = switchLanguageServerAction;
    $[12] = theme;
    $[13] = translations;
    $[14] = user;
    $[15] = t1;
  } else {
    t1 = $[15];
  }
  return t1;
};
//# sourceMappingURL=index.js.map
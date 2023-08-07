import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { useConfig } from '../Config';
import { useAuth } from '../Auth';
import { requests } from '../../../api';

type PreferencesContext = {
  getPreference: <T = any>(key: string) => T | Promise<T>;
  setPreference: <T = any>(key: string, value: T) => void;
}

const Context = createContext({} as PreferencesContext);

const requestOptions = (value, language) => ({
  body: JSON.stringify({ value }),
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': language,
  },
});

export const PreferencesProvider: React.FC<{children?: React.ReactNode}> = ({ children }) => {
  const contextRef = useRef({} as PreferencesContext);
  const preferencesRef = useRef({});
  const config = useConfig();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const { serverURL, routes: { api } } = config;

  useEffect(() => {
    if (!user) {
      // clear preferences between users
      preferencesRef.current = {};
    }
  }, [user]);

  const getPreference = useCallback(async <T = any>(key: string): Promise<T> => {
    const prefs = preferencesRef.current;
    if (typeof prefs[key] !== 'undefined') return prefs[key];
    const promise = new Promise((resolve: (value: T) => void) => {
      (async () => {
        const request = await requests.get(`${serverURL}${api}/_preferences/${key}`, {
          headers: {
            'Accept-Language': i18n.language,
          },
        });
        let value = null;
        if (request.status === 200) {
          const preference = await request.json();
          value = preference.value;
        }
        preferencesRef.current[key] = value;
        resolve(value);
      })();
    });
    prefs[key] = promise;
    return promise;
  }, [i18n.language, api, preferencesRef, serverURL]);

  const setPreference = useCallback(async (key: string, value: unknown): Promise<void> => {
    preferencesRef.current[key] = value;
    await requests.post(`${serverURL}${api}/_preferences/${key}`, requestOptions(value, i18n.language));
  }, [api, i18n.language, serverURL]);

  contextRef.current.getPreference = getPreference;
  contextRef.current.setPreference = setPreference;

  return (
    <Context.Provider value={contextRef.current}>
      {children}
    </Context.Provider>
  );
};

export const usePreferences = (): PreferencesContext => useContext(Context);

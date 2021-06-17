import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useAuth, useConfig } from '@payloadcms/config-provider';
import { requests } from '../../../api';

type PreferencesContext = {
  getPreference: <T>(key: string) => T | Promise<T>;
  setPreference: <T>(key: string, value: T) => void;
}

const Context = createContext({} as PreferencesContext);

export const PreferencesProvider: React.FC = ({ children }) => {
  const contextRef = useRef({} as PreferencesContext);
  const preferencesRef = useRef({});
  const [preferences, setPreferences] = useState({});
  const config = useConfig();
  const { user } = useAuth();
  const { serverURL, routes: { api } } = config;

  useEffect(() => {
    if (!user) {
      setPreferences({});
    }
  }, [user]);

  const getPreference = useCallback(async (key: string) => {
    if (preferencesRef.current[key]) return preferencesRef.current[key];
    const promise = new Promise((resolve) => {
      (async () => {
        const request = await requests.get(`${serverURL}${api}/_preferences/${key}`);
        setPreferences((prevPreferences) => ({ ...prevPreferences, [key]: request }));
        let value = null;
        if (request.status === 200) {
          const preference = await request.json();
          value = preference.value;
        }
        setPreferences((prevPreferences) => ({ ...prevPreferences, [key]: value }));
        resolve(value);
      })();
    });
    setPreferences((prevPreferences) => ({ ...prevPreferences, [key]: promise }));
    return promise;
  }, [api, preferencesRef, serverURL]);

  const setPreference = useCallback(async (key: string, value: unknown): Promise<void> => {
    const options = {
      body: JSON.stringify({ value }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
    setPreferences((prevPreferences) => ({ ...prevPreferences, [key]: value }));
    await requests.post(`${serverURL}${api}/_preferences/${key}`, options);
  }, [api, serverURL]);

  contextRef.current.getPreference = getPreference;
  contextRef.current.setPreference = setPreference;
  preferencesRef.current = preferences;

  return (
    <Context.Provider value={contextRef.current}>
      {children}
    </Context.Provider>
  );
};

export const usePreferences = (): PreferencesContext => useContext(Context);

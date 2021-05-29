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
  const [preferences, setPreferences] = useState({});
  const config = useConfig();
  const { user } = useAuth();
  const { serverURL, routes: { api } } = config;

  useEffect(() => {
    if (!user) {
      setPreferences({});
    }
  }, [user]);

  // TODO: need to prevent having same fetch call many times from outside hooks
  const getPreference = useCallback(async (key: string) => {
    if (!user) return null;
    if (preferences[key]) return preferences[key];
    const request = await requests.get(`${serverURL}${api}/_preferences/${key}`);
    let preference;
    if (request.status === 200) {
      preference = await request.json();
      setPreferences({ ...preferences, [key]: preference.value });
    }
    if (request.status === 404) {
      setPreferences({ ...preferences, [key]: null });
      return null;
    }
    return preference.value;
  }, [api, preferences, serverURL, user]);

  function setPreference<T>(key: string, value: T): void {
    if (!user) throw new Error('You must be logged in to set preferences');
    if (preferences[key] === value) return;
    const options = {
      body: JSON.stringify({ value }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
    setPreferences({ ...preferences, [key]: value });
    if (preferences[key] !== value) {
      requests.post(`${serverURL}${api}/_preferences/${key}`, options);
    }
  }

  // did not work to prevent same fetch
  // contextRef.current.getPreference = useCallback((key: string) => getPreference(key), [getPreference]);
  contextRef.current.getPreference = getPreference;
  contextRef.current.setPreference = setPreference;

  return (
    <Context.Provider value={contextRef.current}>
      {children}
    </Context.Provider>
  );
};

export const usePreferences = (): PreferencesContext => useContext(Context);

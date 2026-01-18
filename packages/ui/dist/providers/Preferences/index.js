'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { dequal } from 'dequal/lite'; // lite: no need for Map and Set support
import { formatAdminURL } from 'payload/shared';
import React, { createContext, use, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../../providers/Translation/index.js';
import { requests } from '../../utilities/api.js';
import { deepMergeSimple } from '../../utilities/deepMerge.js';
import { useAuth } from '../Auth/index.js';
import { useConfig } from '../Config/index.js';
const Context = /*#__PURE__*/createContext({});
const requestOptions = (value, language) => ({
  body: JSON.stringify({
    value
  }),
  headers: {
    'Accept-Language': language,
    'Content-Type': 'application/json'
  }
});
export const PreferencesProvider = ({
  children
}) => {
  const contextRef = useRef({});
  const preferencesRef = useRef({});
  const pendingUpdate = useRef({});
  const {
    config
  } = useConfig();
  const {
    user
  } = useAuth();
  const {
    i18n
  } = useTranslation();
  const {
    routes: {
      api
    }
  } = config;
  useEffect(() => {
    if (!user) {
      // clear preferences between users
      preferencesRef.current = {};
    }
  }, [user]);
  const getPreference = useCallback(async key => {
    const prefs = preferencesRef.current;
    if (typeof prefs[key] !== 'undefined') {
      return prefs[key];
    }
    const promise = new Promise(resolve => {
      void (async () => {
        const request = await requests.get(formatAdminURL({
          apiRoute: api,
          path: `/payload-preferences/${key}`
        }), {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language
          }
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
  }, [i18n.language, api, preferencesRef]);
  const setPreference = useCallback(async (key_0, value_0, merge = false) => {
    if (merge === false) {
      preferencesRef.current[key_0] = value_0;
      await requests.post(formatAdminURL({
        apiRoute: api,
        path: `/payload-preferences/${key_0}`
      }), requestOptions(value_0, i18n.language));
      return;
    }
    let newValue = value_0;
    const currentPreference = await getPreference(key_0);
    // handle value objects where multiple values can be set under one key
    if (typeof value_0 === 'object' && typeof currentPreference === 'object' && typeof newValue === 'object') {
      // merge the value with any existing preference for the key
      if (currentPreference) {
        newValue = deepMergeSimple(currentPreference, newValue);
      }
      if (dequal(newValue, currentPreference)) {
        return;
      }
      // add the requested changes to a pendingUpdate batch for the key
      pendingUpdate.current[key_0] = {
        ...pendingUpdate.current[key_0],
        ...newValue
      };
    } else {
      if (newValue === currentPreference) {
        return;
      }
      pendingUpdate.current[key_0] = newValue;
    }
    const updatePreference = async () => {
      // compare the value stored in context before sending to eliminate duplicate requests
      if (dequal(pendingUpdate.current[key_0], preferencesRef.current[key_0])) {
        return;
      }
      // preference set in context here to prevent other updatePreference at the same time
      preferencesRef.current[key_0] = pendingUpdate.current[key_0];
      await requests.post(formatAdminURL({
        apiRoute: api,
        path: `/payload-preferences/${key_0}`
      }), requestOptions(preferencesRef.current[key_0], i18n.language));
      // reset any changes for this key after sending the request
      delete pendingUpdate.current[key_0];
    };
    // use timeout to allow multiple changes of different values using the same key in one request
    setTimeout(() => {
      void updatePreference();
    });
  }, [api, getPreference, i18n.language, pendingUpdate]);
  contextRef.current.getPreference = getPreference;
  contextRef.current.setPreference = setPreference;
  return /*#__PURE__*/_jsx(Context, {
    value: contextRef.current,
    children: children
  });
};
export const usePreferences = () => use(Context);
//# sourceMappingURL=index.js.map
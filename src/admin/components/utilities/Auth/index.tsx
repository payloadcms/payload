import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Permissions, User } from '../../../../auth/types';
import { useConfig } from '../Config';
import { requests } from '../../../api';
import useDebounce from '../../../hooks/useDebounce';
import { AuthContext } from './types';

const Context = createContext({} as AuthContext);

const maxTimeoutTime = 2147483647;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>();
  const [tokenInMemory, setTokenInMemory] = useState<string>();
  const [tokenExpiration, setTokenExpiration] = useState<number>();
  const { pathname } = useLocation();
  const { push } = useHistory();

  const config = useConfig();

  const {
    admin: {
      user: userSlug,
      inactivityRoute: logoutInactivityRoute,
      autoLogin,
    },
    serverURL,
    routes: {
      admin,
      api,
    },
  } = config;

  const exp = tokenExpiration;

  const [permissions, setPermissions] = useState<Permissions>();

  const { i18n } = useTranslation();
  const { openModal, closeAllModals } = useModal();
  const [lastLocationChange, setLastLocationChange] = useState(0);
  const debouncedLocationChange = useDebounce(lastLocationChange, 10000);

  const id = user?.id;

  const redirectToInactivityRoute = useCallback(() => {
    if (window.location.pathname.startsWith(admin)) {
      const redirectParam = `?redirect=${encodeURIComponent(window.location.pathname.replace(admin, ''))}`;
      push(`${admin}${logoutInactivityRoute}${redirectParam}`);
    } else {
      push(`${admin}${logoutInactivityRoute}`);
    }
    closeAllModals();
  }, [push, admin, logoutInactivityRoute, closeAllModals]);

  const revokeTokenAndExpire = useCallback(() => {
    setTokenInMemory(undefined);
    setTokenExpiration(undefined);
  }, []);

  const setTokenAndExpiration = useCallback((json) => {
    const token = json?.token || json?.refreshedToken;
    if (token && json?.exp) {
      setTokenInMemory(token);
      setTokenExpiration(json.exp);
    } else {
      revokeTokenAndExpire();
    }
  }, [revokeTokenAndExpire]);

  const refreshCookie = useCallback((forceRefresh?: boolean) => {
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = (typeof exp === 'number' ? exp : 0) - now;

    if (forceRefresh || (exp && remainingTime < 120)) {
      setTimeout(async () => {
        try {
          const request = await requests.post(`${serverURL}${api}/${userSlug}/refresh-token`, {
            headers: {
              'Accept-Language': i18n.language,
              'x-payload-admin': 'true',
            },
          });

          if (request.status === 200) {
            const json = await request.json();
            setUser(json.user);
            setTokenAndExpiration(json);
          } else {
            setUser(null);
            redirectToInactivityRoute();
          }
        } catch (e) {
          toast.error(e.message);
        }
      }, 1000);
    }
  }, [serverURL, api, userSlug, i18n, exp, redirectToInactivityRoute, setTokenAndExpiration]);

  const refreshCookieAsync = useCallback(async (skipSetUser?: boolean): Promise<User> => {
    try {
      const request = await requests.post(`${serverURL}${api}/${userSlug}/refresh-token`, {
        headers: {
          'Accept-Language': i18n.language,
          'x-payload-admin': 'true',
        },
      });

      if (request.status === 200) {
        const json = await request.json();
        if (!skipSetUser) {
          setUser(json.user);
          setTokenAndExpiration(json);
        }
        return json.user;
      }

      setUser(null);
      redirectToInactivityRoute();
      return null;
    } catch (e) {
      toast.error(`Refreshing token failed: ${e.message}`);
      return null;
    }
  }, [serverURL, api, userSlug, i18n, redirectToInactivityRoute, setTokenAndExpiration]);

  const logOut = useCallback(() => {
    setUser(null);
    revokeTokenAndExpire();
    requests.post(`${serverURL}${api}/${userSlug}/logout`);
  }, [serverURL, api, userSlug, revokeTokenAndExpire]);

  const refreshPermissions = useCallback(async () => {
    try {
      const request = await requests.get(`${serverURL}${api}/access`, {
        headers: {
          'Accept-Language': i18n.language,
          'x-payload-admin': 'true',
        },
      });

      if (request.status === 200) {
        const json: Permissions = await request.json();
        setPermissions(json);
      } else {
        throw new Error(`Fetching permissions failed with status code ${request.status}`);
      }
    } catch (e) {
      toast.error(`Refreshing permissions failed: ${e.message}`);
    }
  }, [serverURL, api, i18n]);

  const fetchFullUser = React.useCallback(async () => {
    try {
      const request = await requests.get(`${serverURL}${api}/${userSlug}/me`, {
        headers: {
          'Accept-Language': i18n.language,
          'x-payload-admin': 'true',
        },
      });

      if (request.status === 200) {
        const json = await request.json();

        if (json?.user) {
          setUser(json.user);
          if (json?.token) {
            setTokenAndExpiration(json);
          }
        } else if (autoLogin && autoLogin.prefillOnly !== true) {
          // auto log-in with the provided autoLogin credentials. This is used in dev mode
          // so you don't have to log in over and over again
          const autoLoginResult = await requests.post(`${serverURL}${api}/${userSlug}/login`, {
            body: JSON.stringify({
              email: autoLogin.email,
              password: autoLogin.password,
            }),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
              'x-payload-admin': 'true',
            },
          });
          if (autoLoginResult.status === 200) {
            const autoLoginJson = await autoLoginResult.json();
            setUser(autoLoginJson.user);
            if (autoLoginJson?.token) {
              setTokenAndExpiration(autoLoginJson);
            }
          } else {
            setUser(null);
            revokeTokenAndExpire();
          }
        } else {
          setUser(null);
          revokeTokenAndExpire();
        }
      }
    } catch (e) {
      toast.error(`Fetching user failed: ${e.message}`);
    }
  }, [serverURL, api, userSlug, i18n, autoLogin, setTokenAndExpiration, revokeTokenAndExpire]);

  // On mount, get user and set
  useEffect(() => {
    fetchFullUser();
  }, [fetchFullUser]);

  // When location changes, refresh cookie
  useEffect(() => {
    if (id) {
      refreshCookie();
    }
  }, [debouncedLocationChange, refreshCookie, id]);

  useEffect(() => {
    setLastLocationChange(Date.now());
  }, [pathname]);

  // When user changes, get new access
  useEffect(() => {
    if (id) {
      refreshPermissions();
    }
  }, [i18n, id, api, serverURL, refreshPermissions]);

  useEffect(() => {
    let reminder: ReturnType<typeof setTimeout>;
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = typeof exp === 'number' ? exp - now : 0;

    if (remainingTime > 0) {
      reminder = setTimeout(() => {
        openModal('stay-logged-in');
      }, Math.max(Math.min((remainingTime - 60) * 1000, maxTimeoutTime)));
    }

    return () => {
      if (reminder) clearTimeout(reminder);
    };
  }, [exp, openModal]);

  useEffect(() => {
    let forceLogOut: ReturnType<typeof setTimeout>;
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = typeof exp === 'number' ? exp - now : 0;

    if (remainingTime > 0) {
      forceLogOut = setTimeout(() => {
        setUser(null);
        revokeTokenAndExpire();
        redirectToInactivityRoute();
      }, Math.max(Math.min(remainingTime * 1000, maxTimeoutTime), 0));
    }

    return () => {
      if (forceLogOut) clearTimeout(forceLogOut);
    };
  }, [exp, closeAllModals, i18n, redirectToInactivityRoute, revokeTokenAndExpire]);

  return (
    <Context.Provider value={{
      user,
      setUser,
      logOut,
      refreshCookie,
      refreshCookieAsync,
      refreshPermissions,
      permissions,
      token: tokenInMemory,
      fetchFullUser,
    }}
    >
      {children}
    </Context.Provider>
  );
};

type UseAuth<T = User> = () => AuthContext<T>;

export const useAuth: UseAuth = () => useContext(Context);

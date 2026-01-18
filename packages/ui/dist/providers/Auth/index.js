'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { usePathname, useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { createContext, use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { requests } from '../../utilities/api.js';
import { useConfig } from '../Config/index.js';
import { useRouteTransition } from '../RouteTransition/index.js';
const Context = /*#__PURE__*/createContext({});
const maxTimeoutMs = 2147483647;
export function AuthProvider({
  children,
  permissions: initialPermissions,
  user: initialUser
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    config
  } = useConfig();
  const {
    admin: {
      autoLogin,
      autoRefresh,
      routes: {
        inactivity: logoutInactivityRoute
      },
      user: userSlug
    },
    routes: {
      admin: adminRoute,
      api: apiRoute
    }
  } = config;
  const {
    i18n
  } = useTranslation();
  const {
    closeAllModals,
    openModal
  } = useModal();
  const {
    startRouteTransition
  } = useRouteTransition();
  const [user, setUserInMemory] = useState(initialUser);
  const [tokenInMemory, setTokenInMemory] = useState();
  const [tokenExpirationMs, setTokenExpirationMs] = useState();
  const [permissions, setPermissions] = useState(initialPermissions);
  const [forceLogoutBufferMs, setForceLogoutBufferMs] = useState(120_000);
  const [fetchedUserOnMount, setFetchedUserOnMount] = useState(false);
  const refreshTokenTimeoutRef = React.useRef(null);
  const reminderTimeoutRef = React.useRef(null);
  const forceLogOutTimeoutRef = React.useRef(null);
  const id = user?.id;
  const redirectToInactivityRoute = useCallback(() => {
    const baseAdminRoute = formatAdminURL({
      adminRoute,
      path: ''
    });
    startRouteTransition(() => router.replace(formatAdminURL({
      adminRoute,
      path: `${logoutInactivityRoute}${window.location.pathname.startsWith(baseAdminRoute) ? `?redirect=${encodeURIComponent(window.location.pathname)}` : ''}`
    })));
    closeAllModals();
  }, [router, adminRoute, logoutInactivityRoute, closeAllModals, startRouteTransition]);
  const revokeTokenAndExpire = useCallback(() => {
    setUserInMemory(null);
    setTokenInMemory(undefined);
    setTokenExpirationMs(undefined);
    clearTimeout(refreshTokenTimeoutRef.current);
  }, []);
  // Handler for reminder timeout - uses useEffectEvent to capture latest autoRefresh value
  const handleReminderTimeout = useEffectEvent(() => {
    if (autoRefresh) {
      refreshCookieEvent();
    } else {
      openModal(stayLoggedInModalSlug);
    }
  });
  const setNewUser = useCallback(userResponse => {
    clearTimeout(reminderTimeoutRef.current);
    clearTimeout(forceLogOutTimeoutRef.current);
    if (userResponse?.user) {
      setUserInMemory(userResponse.user);
      setTokenInMemory(userResponse.token);
      setTokenExpirationMs(userResponse.exp * 1000);
      const expiresInMs = Math.max(0, Math.min((userResponse.exp ?? 0) * 1000 - Date.now(), maxTimeoutMs));
      if (expiresInMs) {
        const nextForceLogoutBufferMs = Math.min(60_000, expiresInMs / 2);
        setForceLogoutBufferMs(nextForceLogoutBufferMs);
        reminderTimeoutRef.current = setTimeout(handleReminderTimeout, Math.max(expiresInMs - nextForceLogoutBufferMs, 0));
        forceLogOutTimeoutRef.current = setTimeout(() => {
          revokeTokenAndExpire();
          redirectToInactivityRoute();
        }, expiresInMs);
      }
    } else {
      revokeTokenAndExpire();
    }
  }, [redirectToInactivityRoute, revokeTokenAndExpire]);
  const refreshCookie = useCallback(forceRefresh => {
    if (!id) {
      return;
    }
    const expiresInMs_0 = Math.max(0, (tokenExpirationMs ?? 0) - Date.now());
    if (forceRefresh || tokenExpirationMs && expiresInMs_0 < forceLogoutBufferMs * 2) {
      clearTimeout(refreshTokenTimeoutRef.current);
      refreshTokenTimeoutRef.current = setTimeout(async () => {
        try {
          const request = await requests.post(formatAdminURL({
            apiRoute,
            path: `/${userSlug}/refresh-token?refresh`
          }), {
            headers: {
              'Accept-Language': i18n.language
            }
          });
          if (request.status === 200) {
            const json = await request.json();
            setNewUser(json);
          } else {
            setNewUser(null);
            redirectToInactivityRoute();
          }
        } catch (e) {
          toast.error(e.message);
        }
      }, 1000);
    }
  }, [apiRoute, i18n.language, redirectToInactivityRoute, setNewUser, tokenExpirationMs, userSlug, forceLogoutBufferMs, id]);
  const refreshCookieAsync = useCallback(async skipSetUser => {
    try {
      const request_0 = await requests.post(formatAdminURL({
        apiRoute,
        path: `/${userSlug}/refresh-token`
      }), {
        headers: {
          'Accept-Language': i18n.language
        }
      });
      if (request_0.status === 200) {
        const json_0 = await request_0.json();
        if (!skipSetUser) {
          setNewUser(json_0);
        }
        return json_0.user;
      }
      if (user) {
        setNewUser(null);
        redirectToInactivityRoute();
      }
    } catch (e_0) {
      toast.error(`Refreshing token failed: ${e_0.message}`);
    }
    return null;
  }, [apiRoute, i18n.language, redirectToInactivityRoute, setNewUser, userSlug, user]);
  const logOut = useCallback(async () => {
    try {
      if (user && user.collection) {
        setNewUser(null);
        await requests.post(formatAdminURL({
          apiRoute,
          path: `/${user.collection}/logout`
        }));
      }
    } catch (_) {
      // fail silently and log the user out in state
    }
    return true;
  }, [apiRoute, setNewUser, user]);
  const refreshPermissions = useCallback(async ({
    locale
  } = {}) => {
    const params = qs.stringify({
      locale
    }, {
      addQueryPrefix: true
    });
    try {
      const request_1 = await requests.get(formatAdminURL({
        apiRoute,
        path: `/access${params}`
      }), {
        headers: {
          'Accept-Language': i18n.language
        }
      });
      if (request_1.status === 200) {
        const json_1 = await request_1.json();
        setPermissions(json_1);
      } else {
        throw new Error(`Fetching permissions failed with status code ${request_1.status}`);
      }
    } catch (e_1) {
      toast.error(`Refreshing permissions failed: ${e_1.message}`);
    }
  }, [apiRoute, i18n]);
  const fetchFullUser = React.useCallback(async () => {
    try {
      const request_2 = await requests.get(formatAdminURL({
        apiRoute,
        path: `/${userSlug}/me`
      }), {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language
        }
      });
      if (request_2.status === 200) {
        const json_2 = await request_2.json();
        setNewUser(json_2);
        return json_2?.user || null;
      }
    } catch (e_2) {
      toast.error(`Fetching user failed: ${e_2.message}`);
    }
    return null;
  }, [apiRoute, userSlug, i18n.language, setNewUser]);
  const refreshCookieEvent = useEffectEvent(refreshCookie);
  useEffect(() => {
    // when location changes, refresh cookie
    refreshCookieEvent();
  }, [pathname]);
  const fetchFullUserEvent = useEffectEvent(fetchFullUser);
  useEffect(() => {
    async function fetchUserOnMount() {
      await fetchFullUserEvent();
      setFetchedUserOnMount(true);
    }
    void fetchUserOnMount();
  }, []);
  useEffect(() => {
    if (!user && autoLogin && !autoLogin.prefillOnly) {
      void fetchFullUserEvent();
    }
  }, [user, autoLogin]);
  useEffect(() => () => {
    // remove all timeouts on unmount
    clearTimeout(refreshTokenTimeoutRef.current);
    clearTimeout(reminderTimeoutRef.current);
    clearTimeout(forceLogOutTimeoutRef.current);
  }, []);
  if (!user && !fetchedUserOnMount) {
    return null;
  }
  return /*#__PURE__*/_jsx(Context, {
    value: {
      fetchFullUser,
      logOut,
      permissions,
      refreshCookie,
      refreshCookieAsync,
      refreshPermissions,
      setPermissions,
      setUser: setNewUser,
      token: tokenInMemory,
      tokenExpirationMs,
      user
    },
    children: children
  });
}
export const useAuth = () => use(Context);
//# sourceMappingURL=index.js.map
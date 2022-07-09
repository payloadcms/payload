import React, {
  useState, createContext, useContext, useEffect, useCallback,
} from 'react';
import jwtDecode from 'jwt-decode';
import { useLocation, useHistory } from 'react-router-dom';
import { useModal } from '@faceless-ui/modal';
import { User, Permissions } from '../../../../auth/types';
import { useConfig } from '../Config';
import { requests } from '../../../api';
import useDebounce from '../../../hooks/useDebounce';
import { AuthContext } from './types';

const Context = createContext({} as AuthContext);

const maxTimeoutTime = 2147483647;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>();
  const [tokenInMemory, setTokenInMemory] = useState<string>();
  const { pathname } = useLocation();
  const { push } = useHistory();

  const config = useConfig();

  const {
    admin: {
      user: userSlug,
    },
    serverURL,
    routes: {
      admin,
      api,
    },
  } = config;

  const exp = user?.exp;

  const [permissions, setPermissions] = useState<Permissions>();


  const { open: openModal, closeAll: closeAllModals } = useModal();
  const [lastLocationChange, setLastLocationChange] = useState(0);
  const debouncedLocationChange = useDebounce(lastLocationChange, 10000);

  const id = user?.id;

  const refreshCookie = useCallback(() => {
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = (exp as number || 0) - now;

    if (exp && remainingTime < 120) {
      setTimeout(async () => {
        const request = await requests.post(`${serverURL}${api}/${userSlug}/refresh-token`);

        if (request.status === 200) {
          const json = await request.json();
          setUser(json.user);
        } else {
          setUser(null);
          push(`${admin}/logout-inactivity`);
        }
      }, 1000);
    }
  }, [setUser, push, exp, admin, api, serverURL, userSlug]);

  const setToken = useCallback((token: string) => {
    const decoded = jwtDecode(token) as User;
    setUser(decoded);
    setTokenInMemory(token);
  }, []);

  const logOut = () => {
    setUser(null);
    setTokenInMemory(undefined);
    requests.post(`${serverURL}${api}/${userSlug}/logout`);
  };

  // On mount, get user and set
  useEffect(() => {
    const fetchMe = async () => {
      const request = await requests.get(`${serverURL}${api}/${userSlug}/me`);

      if (request.status === 200) {
        const json = await request.json();

        setUser(json?.user || null);

        if (json?.token) {
          setToken(json.token);
        }
      }
    };

    fetchMe();
  }, [setToken, api, serverURL, userSlug]);

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
    async function getPermissions() {
      const request = await requests.get(`${serverURL}${api}/access`);

      if (request.status === 200) {
        const json: Permissions = await request.json();
        setPermissions(json);
      }
    }

    if (id) {
      getPermissions();
    }
  }, [id, api, serverURL]);

  useEffect(() => {
    let reminder: ReturnType<typeof setTimeout>;
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = exp as number - now;

    if (remainingTime > 0) {
      reminder = setTimeout(() => {
        openModal('stay-logged-in');
      }, (Math.min((remainingTime - 60) * 1000), maxTimeoutTime));
    }

    return () => {
      if (reminder) clearTimeout(reminder);
    };
  }, [exp, openModal]);

  useEffect(() => {
    let forceLogOut: ReturnType<typeof setTimeout>;
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = exp as number - now;

    if (remainingTime > 0) {
      forceLogOut = setTimeout(() => {
        setUser(null);
        push(`${admin}/logout-inactivity`);
        closeAllModals();
      }, Math.min(remainingTime * 1000, maxTimeoutTime));
    }

    return () => {
      if (forceLogOut) clearTimeout(forceLogOut);
    };
  }, [exp, push, closeAllModals, admin]);

  return (
    <Context.Provider value={{
      user,
      logOut,
      refreshCookie,
      permissions,
      setToken,
      token: tokenInMemory,
    }}
    >
      {children}
    </Context.Provider>
  );
};

export const useAuth = (): AuthContext => useContext(Context);

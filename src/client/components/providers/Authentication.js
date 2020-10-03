import React, {
  useState, createContext, useContext, useEffect, useCallback,
} from 'react';
import jwtDecode from 'jwt-decode';
import { useLocation, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useModal } from '@faceless-ui/modal';
import { useConfig } from './Config';
import { requests } from '../../api';
import StayLoggedInModal from '../modals/StayLoggedIn';
import useDebounce from '../../hooks/useDebounce';

const Context = createContext({});

const AuthenticationProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [tokenInMemory, setTokenInMemory] = useState(null);

  const {
    admin: {
      user: userSlug,
    },
    serverURL,
    routes: {
      admin,
      api,
    },
  } = useConfig();

  const exp = user?.exp;

  const [permissions, setPermissions] = useState({ canAccessAdmin: null });

  const { pathname } = useLocation();
  const history = useHistory();
  const { open: openModal, closeAll: closeAllModals } = useModal();
  const [lastLocationChange, setLastLocationChange] = useState(0);
  const debouncedLocationChange = useDebounce(lastLocationChange, 10000);

  const email = user?.email;

  const refreshCookie = useCallback(() => {
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = (exp || 0) - now;

    if (exp && remainingTime < 120) {
      setTimeout(async () => {
        const request = await requests.post(`${serverURL}${api}/${userSlug}/refresh-token`);

        if (request.status === 200) {
          const json = await request.json();
          setUser(json.user);
        } else {
          setUser(null);
          history.push(`${admin}/logout-inactivity`);
        }
      }, 1000);
    }
  }, [setUser, history, exp, admin, api, serverURL, userSlug]);

  const setToken = useCallback((token) => {
    const decoded = jwtDecode(token);
    setUser(decoded);
    setTokenInMemory(token);
  }, []);

  const logOut = () => {
    setUser(null);
    setTokenInMemory(null);
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
    if (email) {
      refreshCookie();
    }
  }, [debouncedLocationChange, refreshCookie, email]);

  useEffect(() => {
    setLastLocationChange(Date.now());
  }, [pathname]);

  // When user changes, get new access
  useEffect(() => {
    async function getPermissions() {
      const request = await requests.get(`${serverURL}${api}/access`);

      if (request.status === 200) {
        const json = await request.json();
        setPermissions(json);
      }
    }

    if (email) {
      getPermissions();
    }
  }, [email, api, serverURL]);

  useEffect(() => {
    let reminder = false;
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = exp - now;

    if (remainingTime > 0) {
      reminder = setTimeout(() => {
        openModal('stay-logged-in');
      }, ((remainingTime - 60) * 1000));
    }

    return () => {
      if (reminder) clearTimeout(reminder);
    };
  }, [exp, openModal]);

  useEffect(() => {
    let forceLogOut = false;
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = exp - now;

    if (remainingTime > 0) {
      forceLogOut = setTimeout(() => {
        setUser(null);
        history.push(`${admin}/logout`);
        closeAllModals();
      }, remainingTime * 1000);
    }

    return () => {
      if (forceLogOut) clearTimeout(forceLogOut);
    };
  }, [exp, history, closeAllModals, admin]);

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
      <StayLoggedInModal refreshCookie={refreshCookie} />
    </Context.Provider>
  );
};

AuthenticationProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

const useAuthentication = () => useContext(Context);

export {
  AuthenticationProvider,
  useAuthentication,
};

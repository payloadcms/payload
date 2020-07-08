import React, {
  useState, createContext, useContext, useEffect, useCallback,
} from 'react';
import jwt from 'jsonwebtoken';
import { useLocation, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from 'payload/config';
import { useModal } from '@faceless-ui/modal';
import { requests } from '../../api';
import StayLoggedInModal from '../modals/StayLoggedIn';
import useDebounce from '../../hooks/useDebounce';

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

const Context = createContext({});

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [tokenInMemory, setTokenInMemory] = useState(null);
  const exp = user?.exp;

  const [permissions, setPermissions] = useState({ canAccessAdmin: null });

  const { pathname } = useLocation();
  const history = useHistory();
  const { open: openModal, closeAll: closeAllModals } = useModal();
  const [lastLocationChange, setLastLocationChange] = useState(0);
  const debouncedLocationChange = useDebounce(lastLocationChange, 10000);

  const email = user?.email;

  const refreshCookie = useCallback(() => {
    setTimeout(async () => {
      const request = await requests.post(`${serverURL}${api}/${userSlug}/refresh-token`);

      if (request.status === 200) {
        const json = await request.json();
        setUser(json.user);
      }
    }, 1000);
  }, [setUser]);

  const setToken = useCallback((token) => {
    const decoded = jwt.decode(token);
    setUser(decoded);
    setTokenInMemory(token);
  }, []);

  const logOut = () => {
    setUser(null);
    setTokenInMemory(null);
    requests.get(`${serverURL}${api}/${userSlug}/logout`);
  };

  // On mount, get user and set
  useEffect(() => {
    const fetchMe = async () => {
      const request = await requests.get(`${serverURL}${api}/${userSlug}/me`);

      if (request.status === 200) {
        const json = await request.json();
        setUser(json);
      }
    };

    fetchMe();
  }, []);

  // When location changes, refresh cookie
  useEffect(() => {
    if (email) {
      refreshCookie();
    }
  }, [debouncedLocationChange, refreshCookie, email]);

  useEffect(() => {
    setLastLocationChange(Date.now());
  }, [pathname]);

  // When user changes, get new policies
  useEffect(() => {
    async function getPermissions() {
      const request = await requests.get(`${serverURL}${api}/policies`);

      if (request.status === 200) {
        const json = await request.json();
        setPermissions(json);
      }
    }

    if (email) {
      getPermissions();
    }
  }, [email]);

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
        history.push(`${admin}/logout`);
        closeAllModals();
      }, remainingTime * 1000);
    }

    return () => {
      if (forceLogOut) clearTimeout(forceLogOut);
    };
  }, [exp, history, closeAllModals]);

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

UserProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

const useUser = () => useContext(Context);

export {
  UserProvider,
  useUser,
};

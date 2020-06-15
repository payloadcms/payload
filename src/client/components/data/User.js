import React, {
  useState, createContext, useContext, useEffect, useCallback,
} from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
import config from 'payload/config';
import { useModal } from '@trbl/react-modal';
import { requests } from '../../api';
import StayLoggedInModal from '../modals/StayLoggedIn';
import useDebounce from '../../hooks/useDebounce';

const {
  cookiePrefix,
  admin: {
    user: userSlug,
  },
  serverURL,
  routes: {
    admin,
    api,
  },
} = config;

const cookieTokenName = `${cookiePrefix}-token`;

const cookies = new Cookies();
const Context = createContext({});

const isNotExpired = decodedJWT => (decodedJWT?.exp || 0) > Date.now() / 1000;

const UserProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  const [permissions, setPermissions] = useState({ canAccessAdmin: null });

  const { pathname } = useLocation();
  const history = useHistory();
  const { open: openModal, closeAll: closeAllModals } = useModal();
  const [lastLocationChange, setLastLocationChange] = useState(0);
  const debouncedLocationChange = useDebounce(lastLocationChange, 10000);

  const exp = user?.exp || 0;
  const email = user?.email;

  const refreshToken = useCallback(() => {
    // Need to retrieve token straight from cookie so as to keep this function
    // with no dependencies and to make sure we have the exact token that will be used
    // in the request to the /refresh route
    const tokenFromCookie = cookies.get(cookieTokenName);
    const decodedToken = jwt.decode(tokenFromCookie);

    if (decodedToken?.exp > (Date.now() / 1000)) {
      setTimeout(async () => {
        const request = await requests.post(`${serverURL}${api}/${userSlug}/refresh-token`);

        if (request.status === 200) {
          const json = await request.json();
          setToken(json.refreshedToken);
        }
      }, 1000);
    }
  }, [setToken]);

  const logOut = () => {
    setUser(null);
    setToken(null);
    cookies.remove(cookieTokenName, { path: '/' });
  };

  // On mount, get cookie and set as token
  useEffect(() => {
    const cookieToken = cookies.get(cookieTokenName);
    if (cookieToken) setToken(cookieToken);
  }, []);

  // When location changes, refresh token
  useEffect(() => {
    refreshToken();
  }, [debouncedLocationChange, refreshToken]);

  useEffect(() => {
    setLastLocationChange(Date.now());
  }, [pathname]);

  // When token changes, set cookie, decode and set user
  useEffect(() => {
    if (token) {
      const decoded = jwt.decode(token);
      if (isNotExpired(decoded)) {
        setUser(decoded);
        cookies.set(cookieTokenName, token, { path: '/' });
      }
    }
  }, [token]);

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
        logOut();
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
      setToken,
      logOut,
      refreshToken,
      token,
      permissions,
    }}
    >
      {children}
      <StayLoggedInModal refreshToken={refreshToken} />
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

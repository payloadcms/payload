import React, {
  useState, createContext, useContext, useEffect, useCallback,
} from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
import { useModal } from '@trbl/react-modal';
import { requests } from '../../api';
import config from '../../securedConfig';
import StayLoggedInModal from '../modals/StayLoggedIn';
import useThrottledEffect from '../../hooks/useThrottledEffect';

const { serverURL, routes: { admin, api } } = config;
const cookies = new Cookies();
const Context = createContext({});

const isNotExpired = decodedJWT => (decodedJWT?.exp || 0) > Date.now() / 1000;

const UserProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const location = useLocation();
  const history = useHistory();
  const { toggle: toggleModal, closeAll: closeAllModals } = useModal();

  const refreshToken = useCallback(() => {
    // Need to retrieve token straight from cookie so as to keep this function
    // with no dependencies and to make sure we have the exact token that will be used
    // in the request to the /refresh route
    const tokenFromCookie = cookies.get('token');
    const decodedToken = jwt.decode(tokenFromCookie);

    if (decodedToken?.exp > (Date.now() / 1000)) {
      setTimeout(async () => {
        const request = await requests.post(`${serverURL}${api}/refresh`);

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
    cookies.remove('token', { path: '/' });
  };

  // On mount, get cookie and set as token
  useEffect(() => {
    const cookieToken = cookies.get('token');
    if (cookieToken) setToken(cookieToken);
  }, []);

  // When location changes, refresh token
  useThrottledEffect(() => {
    refreshToken();
  }, 15000, [location, refreshToken]);

  // When token changes, set cookie, decode and set user
  useEffect(() => {
    if (token) {
      const decoded = jwt.decode(token);
      if (isNotExpired(decoded)) {
        setUser(decoded);
        cookies.set('token', token, { path: '/' });
      }
    }
  }, [token]);

  useEffect(() => {
    let reminder = false;
    let forceLogOut = false;

    const exp = user?.exp || 0;
    const now = Math.round((new Date()).getTime() / 1000);
    const remainingTime = exp - now;

    if (remainingTime > 0) {
      reminder = setTimeout(() => {
        toggleModal('stay-logged-in');
      }, ((remainingTime - 60) * 1000));

      forceLogOut = setTimeout(() => {
        history.push(`${admin}/logout`);
        closeAllModals();
      }, remainingTime * 1000);
    }

    return () => {
      if (reminder) clearTimeout(reminder);
      if (forceLogOut) clearTimeout(forceLogOut);
    };
  }, [user, history, toggleModal, closeAllModals]);

  return (
    <Context.Provider value={{
      user,
      setToken,
      logOut,
      refreshToken,
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

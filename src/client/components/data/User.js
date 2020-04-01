import React, {
  useState, createContext, useContext, useEffect, useCallback,
} from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
import { useModal } from '@trbl/react-modal';
import { requests } from '../../api';
import config from '../../config/sanitizedClientConfig';
import StayLoggedInModal from '../modals/StayLoggedIn';

const cookies = new Cookies();
const Context = createContext({});

const isNotExpired = decodedJWT => decodedJWT?.exp > Date.now() / 1000;

const UserProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const location = useLocation();
  const history = useHistory();
  const { toggle: toggleModal, closeAll: closeAllModals } = useModal();

  const refreshToken = useCallback(() => {
    if (isNotExpired(user)) {
      setTimeout(async () => {
        const request = await requests.post('/refresh');

        if (request.status === 200) {
          const json = await request.json();
          setToken(json.refreshedToken);
        }
      }, 1000);
    }
  }, [user, setToken]);

  const logOut = () => {
    setUser(null);
    cookies.remove('token', { path: '/' });
  };

  // On mount, get cookie and set as token
  useEffect(() => {
    const cookieToken = cookies.get('token');
    if (cookieToken) setToken(cookieToken);
  }, []);


  // When location changes, refresh token
  useEffect(() => {
    refreshToken();
  }, [location, refreshToken]);


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
    const { tokenExpiration } = config.user.auth;

    let reminder = false;
    let forceLogOut = false;

    console.log(user?.exp);

    if (user && isNotExpired(user)) {
      reminder = setTimeout(() => {
        toggleModal('stay-logged-in');
      }, (tokenExpiration - 60) * 1000);

      forceLogOut = setTimeout(() => {
        const { routes: { admin } } = config;
        history.push(`${admin}/logout`);
        closeAllModals();
      }, tokenExpiration * 1000);
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

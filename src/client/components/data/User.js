import React, {
  useState, createContext, useContext, useEffect,
} from 'react';
import { useLocation } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
import { requests } from '../../api';
import config from '../../config/sanitizedClientConfig';

const cookies = new Cookies();
const Context = createContext({});

const UserProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const location = useLocation();

  const refreshToken = async () => {
    const request = await requests.post('/refresh');

    if (request.status === 200) {
      const json = await request.json();
      cookies.set('token', json.refreshToken, { path: '/' });
    }
  };

  const logOut = () => {
    setUser(null);
    cookies.remove('token', { path: '/' });
  };

  useEffect(() => {
    const cookieToken = cookies.get('token');
    if (cookieToken) {
      const decoded = jwt.decode(cookieToken);
      if (decoded.exp > Date.now() / 1000) {
        setUser(decoded);
      }
    }
  }, []);

  useEffect(() => {
    refreshToken();
  }, [location]);

  useEffect(() => {
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded.exp > Date.now() / 1000) {
        setUser(decoded);
        cookies.set('token', token, { path: '/' });
      }
    }
  }, [token]);

  return (
    <Context.Provider value={{
      user,
      setToken,
      logOut,
      refreshToken,
    }}
    >
      {children}
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

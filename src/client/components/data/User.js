import React, {
  useState, createContext, useContext, useEffect,
} from 'react';
import jwtDecode from 'jwt-decode';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const Context = createContext({});

const UserProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cookieToken = cookies.get('token');
    if (cookieToken) {
      const decoded = jwtDecode(cookieToken);
      if (decoded.exp > Date.now() / 1000) {
        setUser(decoded);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded.exp > Date.now() / 1000) {
        setUser(decoded);
        cookies.set('token', token, { path: '/' });
      }
    }
  }, [token]);

  const logOut = () => {
    setUser(null);
    cookies.remove('token', { path: '/' });
  };

  return (
    <Context.Provider value={{
      user,
      setToken,
      logOut,
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

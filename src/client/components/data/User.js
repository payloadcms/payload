import React, {
  useState, createContext, useContext, useEffect,
} from 'react';
import jwtDecode from 'jwt-decode';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const Context = createContext({});

const UserProvider = ({ children }) => {
  const cookieToken = cookies.get('token');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(cookieToken ? jwtDecode(cookieToken) : null);

  useEffect(() => {
    if (token) {
      setUser(jwtDecode(token));
      cookies.set('token', token, { path: '/' });
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

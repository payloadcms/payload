import React, { createContext, useState, useContext } from 'react';

type CustomContext = {
  getCustom
  setCustom
}

const Context = createContext({} as CustomContext);

const CustomProvider: React.FC = ({ children }) => {
  const [getCustom, setCustom] = useState({});

  const value = {
    getCustom,
    setCustom,
  };

  console.log('custom provider called');

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
};

export default CustomProvider;

export const useCustom = () => useContext(Context);

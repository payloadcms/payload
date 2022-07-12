import React, {
  createContext, useCallback, useContext, useState,
} from 'react';

export type Theme = 'light' | 'dark';

export type ThemeContext = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialContext: ThemeContext = {
  theme: 'light',
  setTheme: () => null,
};

const Context = createContext(initialContext);

const localStorageKey = 'payload-theme';

const getTheme = () => {
  let theme: Theme;
  const themeFromStorage = window.localStorage.getItem(localStorageKey);

  if (themeFromStorage === 'light' || themeFromStorage === 'dark') {
    theme = themeFromStorage;
  } else {
    theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    window.localStorage.setItem(localStorageKey, theme);
  }

  document.documentElement.setAttribute('data-theme', theme);
  return theme;
};

export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  const setTheme = useCallback((themeToSet: Theme) => {
    setThemeState(themeToSet);
    window.localStorage.setItem(localStorageKey, themeToSet);
    document.documentElement.setAttribute('data-theme', themeToSet);
  }, []);

  return (
    <Context.Provider value={{ theme, setTheme }}>
      {children}
    </Context.Provider>
  );
};

export const useTheme = (): ThemeContext => useContext(Context);

export default Context;

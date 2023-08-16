import React, {
  createContext, useCallback, useContext, useState,
} from 'react';

export type Theme = 'light' | 'dark';

export type ThemeContext = {
  theme: Theme
  setTheme: (theme: Theme) => void
  autoMode: boolean
}

const initialContext: ThemeContext = {
  theme: 'light',
  setTheme: () => null,
  autoMode: true,
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
  }

  document.documentElement.setAttribute('data-theme', theme);
  return theme;
};

export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [autoMode, setAutoMode] = useState(() => {
    const themeFromStorage = window.localStorage.getItem(localStorageKey);
    return !themeFromStorage;
  });

  const setTheme = useCallback((themeToSet: Theme | 'auto') => {
    if (themeToSet === 'light' || themeToSet === 'dark') {
      setThemeState(themeToSet);
      setAutoMode(false);
      window.localStorage.setItem(localStorageKey, themeToSet);
      document.documentElement.setAttribute('data-theme', themeToSet);
    } else if (themeToSet === 'auto') {
      const existingThemeFromStorage = window.localStorage.getItem(localStorageKey);
      if (existingThemeFromStorage) window.localStorage.removeItem(localStorageKey);
      const themeFromOS = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', themeFromOS);
      setAutoMode(true);
      setThemeState(themeFromOS);
    }
  }, []);

  return (
    <Context.Provider value={{ theme, setTheme, autoMode }}>
      {children}
    </Context.Provider>
  );
};

export const useTheme = (): ThemeContext => useContext(Context);

import React from 'react';
export type Theme = 'dark' | 'light';
export type ThemeContext = {
    autoMode: boolean;
    setTheme: (theme: Theme) => void;
    theme: Theme;
};
export declare const defaultTheme = "light";
export declare const ThemeProvider: React.FC<{
    children?: React.ReactNode;
    theme?: Theme;
}>;
export declare const useTheme: () => ThemeContext;
//# sourceMappingURL=index.d.ts.map
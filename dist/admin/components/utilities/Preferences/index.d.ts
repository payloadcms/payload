import React from 'react';
type PreferencesContext = {
    getPreference: <T = any>(key: string) => T | Promise<T>;
    setPreference: <T = any>(key: string, value: T) => void;
};
export declare const PreferencesProvider: React.FC<{
    children?: React.ReactNode;
}>;
export declare const usePreferences: () => PreferencesContext;
export {};

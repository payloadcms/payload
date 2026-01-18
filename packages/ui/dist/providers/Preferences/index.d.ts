import React from 'react';
import type { Preferences } from '../../forms/Form/types.js';
type PreferencesContext = {
    getPreference: <T = Preferences>(key: string) => Promise<T>;
    /**
     * @param key - a string identifier for the property being set
     * @param value - preference data to store
     * @param merge - when true will combine the existing preference object batch the change into one request for objects, default = false
     */
    setPreference: <T = Preferences>(key: string, value: T, merge?: boolean) => Promise<void>;
};
export declare const PreferencesProvider: React.FC<{
    children?: React.ReactNode;
}>;
export declare const usePreferences: () => PreferencesContext;
export {};
//# sourceMappingURL=index.d.ts.map
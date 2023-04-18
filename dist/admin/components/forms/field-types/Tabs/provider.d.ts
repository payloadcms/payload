import React from 'react';
declare const Context: React.Context<boolean>;
export declare const TabsProvider: React.FC<{
    children?: React.ReactNode;
    withinTab?: boolean;
}>;
export declare const useTabs: () => boolean;
export default Context;

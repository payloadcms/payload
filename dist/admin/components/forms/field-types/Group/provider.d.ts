import React from 'react';
declare const Context: React.Context<boolean>;
export declare const GroupProvider: React.FC<{
    children?: React.ReactNode;
    withinGroup?: boolean;
}>;
export declare const useGroup: () => boolean;
export default Context;

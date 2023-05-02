import React from 'react';
declare const Context: React.Context<boolean>;
export declare const RowProvider: React.FC<{
    children?: React.ReactNode;
    withinRow?: boolean;
}>;
export declare const useRow: () => boolean;
export default Context;

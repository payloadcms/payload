import React from 'react';
declare const Context: React.Context<boolean>;
export declare const CollapsibleProvider: React.FC<{
    children?: React.ReactNode;
    withinCollapsible?: boolean;
}>;
export declare const useCollapsible: () => boolean;
export default Context;

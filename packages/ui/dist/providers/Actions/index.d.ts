import React from 'react';
type ActionsContextType = {
    Actions: {
        [key: string]: React.ReactNode;
    };
    setViewActions: (actions: ActionsContextType['Actions']) => void;
};
export declare const useActions: () => ActionsContextType;
export declare const ActionsProvider: React.FC<{
    readonly Actions?: {
        [key: string]: React.ReactNode;
    };
    readonly children: React.ReactNode;
}>;
export {};
//# sourceMappingURL=index.d.ts.map
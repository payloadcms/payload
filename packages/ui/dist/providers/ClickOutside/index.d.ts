import React from 'react';
type Listener = {
    handler: () => void;
    ref: React.RefObject<HTMLElement>;
};
export declare const ClickOutsideProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useClickOutsideContext: () => {
    register: (listener: Listener) => void;
    unregister: (listener: Listener) => void;
};
export {};
//# sourceMappingURL=index.d.ts.map
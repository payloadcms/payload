export declare const useBeforeUnload: (enabled?: (() => boolean) | boolean, message?: string) => void;
export declare const usePreventLeave: ({ hasAccepted, message, onAccept, onPrevent, prevent, }: {
    hasAccepted: boolean;
    message?: string;
    onAccept?: () => void;
    onPrevent?: () => void;
    prevent: boolean;
}) => void;
//# sourceMappingURL=usePreventLeave.d.ts.map
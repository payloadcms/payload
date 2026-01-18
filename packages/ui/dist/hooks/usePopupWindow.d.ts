import type React from 'react';
export interface PopupMessage {
    searchParams: {
        [key: string]: string | undefined;
        code: string;
        installation_id: string;
        state: string;
    };
    type: string;
}
export declare const usePopupWindow: (props: {
    eventType?: string;
    onMessage?: (searchParams: PopupMessage["searchParams"]) => Promise<void>;
    url: string;
}) => {
    isPopupOpen: boolean;
    openPopupWindow: () => void;
    popupRef?: React.RefObject<null | Window>;
};
//# sourceMappingURL=usePopupWindow.d.ts.map
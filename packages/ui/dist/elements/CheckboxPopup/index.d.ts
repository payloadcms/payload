import type { PopupProps } from '../Popup/index.js';
import './index.scss';
type CheckboxPopupProps = {
    Button: React.ReactNode;
    onChange: (args: {
        close: () => void;
        selectedValues: string[];
    }) => void;
    options: {
        label: string;
        value: string;
    }[];
    selectedValues: string[];
} & Omit<PopupProps, 'button' | 'render'>;
export declare function CheckboxPopup({ Button, className, onChange, options, selectedValues, ...popupProps }: CheckboxPopupProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map
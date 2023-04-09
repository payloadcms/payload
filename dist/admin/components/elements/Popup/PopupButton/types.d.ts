/// <reference types="react" />
export type Props = {
    className?: string;
    buttonType: 'custom' | 'default' | 'none';
    button: React.ReactNode;
    setActive: (active: boolean) => void;
    active: boolean;
};

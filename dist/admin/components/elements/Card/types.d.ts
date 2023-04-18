/// <reference types="react" />
export type Props = {
    id?: string;
    title: string;
    actions?: React.ReactNode;
    onClick?: () => void;
};

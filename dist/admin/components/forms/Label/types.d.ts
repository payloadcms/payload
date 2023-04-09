/// <reference types="react" />
export type Props = {
    label?: Record<string, string> | string | false | JSX.Element;
    required?: boolean;
    htmlFor?: string;
};

/// <reference types="react" />
import './index.scss';
declare const ol: {
    Button: () => JSX.Element;
    Element: ({ attributes, children }: {
        attributes: any;
        children: any;
    }) => JSX.Element;
};
export default ol;

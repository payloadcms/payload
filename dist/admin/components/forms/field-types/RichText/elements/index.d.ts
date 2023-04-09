/// <reference types="react" />
declare const elements: {
    h1: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    h2: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    h3: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    h4: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    h5: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    h6: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    link: {
        Button: import("react").FC<{
            path: string;
            fieldProps: import("../types").Props;
        }>;
        Element: import("react").FC<{
            attributes: import("react").HTMLAttributes<HTMLDivElement>;
            children: import("react").ReactNode;
            element: any;
            fieldProps: import("../types").Props;
            editorRef: import("react").RefObject<HTMLDivElement>;
        }>;
        plugins: ((incomingEditor: import("slate").BaseEditor & import("slate-react").ReactEditor & import("slate-history").HistoryEditor) => import("slate").BaseEditor & import("slate-react").ReactEditor & import("slate-history").HistoryEditor)[];
    };
    ol: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    ul: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    li: {
        Element: (props: any) => JSX.Element;
    };
    indent: {
        Button: () => JSX.Element;
        Element: ({ attributes, children }: {
            attributes: any;
            children: any;
        }) => JSX.Element;
    };
    relationship: {
        Button: (props: {
            path: string;
            enabledCollectionSlugs: string[];
        }) => import("react").ReactNode;
        Element: (props: {
            attributes: import("react").HTMLAttributes<HTMLDivElement>;
            children: import("react").ReactNode;
            element: any;
            fieldProps: import("../types").Props;
        }) => import("react").ReactNode;
        plugins: ((incomingEditor: any) => any)[];
    };
    upload: {
        Button: (props: {
            path: string;
            enabledCollectionSlugs: string[];
        }) => import("react").ReactNode;
        Element: (props: import("./upload/Element").ElementProps) => import("react").ReactNode;
        plugins: ((incomingEditor: any) => any)[];
    };
};
export default elements;

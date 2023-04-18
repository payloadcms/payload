/// <reference types="react" />
declare const link: {
    Button: import("react").FC<{
        path: string;
        fieldProps: import("../../types").Props;
    }>;
    Element: import("react").FC<{
        attributes: import("react").HTMLAttributes<HTMLDivElement>;
        children: import("react").ReactNode;
        element: any;
        fieldProps: import("../../types").Props;
        editorRef: import("react").RefObject<HTMLDivElement>;
    }>;
    plugins: ((incomingEditor: import("slate").BaseEditor & import("slate-react").ReactEditor & import("slate-history").HistoryEditor) => import("slate").BaseEditor & import("slate-react").ReactEditor & import("slate-history").HistoryEditor)[];
};
export default link;

import type { ImportMap, SanitizedConfig, ServerFunctionClient } from 'payload';
import React from 'react';
import '@payloadcms/ui/scss/app.scss';
export declare const metadata: {
    description: string;
    title: string;
};
export declare const RootLayout: ({ children, config: configPromise, htmlProps, importMap, serverFunction, }: {
    readonly children: React.ReactNode;
    readonly config: Promise<SanitizedConfig>;
    readonly htmlProps?: React.HtmlHTMLAttributes<HTMLHtmlElement>;
    readonly importMap: ImportMap;
    readonly serverFunction: ServerFunctionClient;
}) => Promise<React.JSX.Element>;
//# sourceMappingURL=index.d.ts.map
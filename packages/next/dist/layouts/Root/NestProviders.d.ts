import type { Config, ImportMap, ServerProps } from 'payload';
import '@payloadcms/ui/scss/app.scss';
import React from 'react';
type Args = {
    readonly children: React.ReactNode;
    readonly importMap: ImportMap;
    readonly providers: Config['admin']['components']['providers'];
    readonly serverProps: ServerProps;
};
export declare function NestProviders({ children, importMap, providers, serverProps, }: Args): React.ReactNode;
export {};
//# sourceMappingURL=NestProviders.d.ts.map
import type { Config, PayloadHandler } from 'payload';
export declare const initClientUploads: <ExtraProps extends Record<string, unknown>, T>({ clientHandler, collections, config, enabled, extraClientHandlerProps, serverHandler, serverHandlerPath, }: {
    /** Path to clientHandler component */
    clientHandler: string;
    collections: Record<string, T>;
    config: Config;
    enabled: boolean;
    /** extra props to pass to the client handler */
    extraClientHandlerProps?: (collection: T) => ExtraProps;
    serverHandler: PayloadHandler;
    serverHandlerPath: string;
}) => void;
//# sourceMappingURL=initClientUploads.d.ts.map
/**
 * This is a React hook to implement {@link https://payloadcms.com/docs/live-preview/overview Payload Live Preview}.
 *
 * @link https://payloadcms.com/docs/live-preview/frontend
 */
export declare const useLivePreview: <T extends Record<string, any>>(props: {
    apiRoute?: string;
    depth?: number;
    /**
     * To prevent the flicker of missing data on initial load,
     * you can pass in the initial page data from the server.
     */
    initialData: T;
    serverURL: string;
}) => {
    data: T;
    /**
     * To prevent the flicker of stale data while the post message is being sent,
     * you can conditionally render loading UI based on the `isLoading` state.
     */
    isLoading: boolean;
};
//# sourceMappingURL=useLivePreview.d.ts.map
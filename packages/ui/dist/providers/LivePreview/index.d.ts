import type { LivePreviewConfig } from 'payload';
import React from 'react';
import type { LivePreviewContextType } from './context.js';
export type LivePreviewProviderProps = {
    appIsReady?: boolean;
    breakpoints?: LivePreviewConfig['breakpoints'];
    children: React.ReactNode;
    deviceSize?: {
        height: number;
        width: number;
    };
    isLivePreviewEnabled?: boolean;
    isLivePreviewing: boolean;
    /**
     * This specifically relates to `admin.preview` function in the config instead of live preview.
     */
    isPreviewEnabled?: boolean;
    /**
     * This specifically relates to `admin.preview` function in the config instead of live preview.
     */
    previewURL?: string;
} & Pick<LivePreviewContextType, 'typeofLivePreviewURL' | 'url'>;
export declare const LivePreviewProvider: React.FC<LivePreviewProviderProps>;
//# sourceMappingURL=index.d.ts.map
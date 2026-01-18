import React from 'react';
import './index.scss';
export declare const VersionPillLabel: React.FC<{
    currentlyPublishedVersion?: {
        id: number | string;
        updatedAt: string;
    };
    disableDate?: boolean;
    doc: {
        [key: string]: unknown;
        id: number | string;
        publishedLocale?: string;
        updatedAt?: string;
        version: {
            [key: string]: unknown;
            _status: string;
        };
    };
    /**
     * By default, the date is displayed first, followed by the version label.
     * @default false
     */
    labelFirst?: boolean;
    labelOverride?: React.ReactNode;
    /**
     * @default 'pill'
     */
    labelStyle?: 'pill' | 'text';
    labelSuffix?: React.ReactNode;
    latestDraftVersion?: {
        id: number | string;
        updatedAt: string;
    };
}>;
//# sourceMappingURL=VersionPillLabel.d.ts.map
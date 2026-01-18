import type { TFunction } from '@payloadcms/translations';
import type { Pill } from '@payloadcms/ui';
type Args = {
    currentlyPublishedVersion?: {
        id: number | string;
        updatedAt: string;
    };
    latestDraftVersion?: {
        id: number | string;
        updatedAt: string;
    };
    t: TFunction;
    version: {
        id: number | string;
        version: {
            _status?: string;
        };
    };
};
/**
 * Gets the appropriate version label and version pill styling
 * given existing versions and the current version status.
 */
export declare function getVersionLabel({ currentlyPublishedVersion, latestDraftVersion, t, version, }: Args): {
    label: string;
    name: 'currentDraft' | 'currentlyPublished' | 'draft' | 'previouslyPublished' | 'published';
    pillStyle: Parameters<typeof Pill>[0]['pillStyle'];
};
export {};
//# sourceMappingURL=getVersionLabel.d.ts.map
import React from 'react';
import type { ReloadDoc } from '../types.js';
import './index.scss';
type Props = {
    readonly allowEdit?: boolean;
    readonly allowRemove?: boolean;
    readonly alt: string;
    readonly byteSize: number;
    readonly className?: string;
    readonly collectionSlug: string;
    readonly displayPreview?: boolean;
    readonly filename: string;
    readonly id?: number | string;
    readonly mimeType: string;
    readonly onRemove: () => void;
    readonly reloadDoc: ReloadDoc;
    readonly showCollectionSlug?: boolean;
    readonly src: string;
    readonly thumbnailSrc: string;
    readonly updatedAt?: string;
    readonly withMeta?: boolean;
    readonly x?: number;
    readonly y?: number;
};
export declare function RelationshipContent(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map
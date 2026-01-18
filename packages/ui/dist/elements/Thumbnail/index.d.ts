import React from 'react';
import './index.scss';
import type { SanitizedCollectionConfig } from 'payload';
export type ThumbnailProps = {
    className?: string;
    collectionSlug?: string;
    doc?: Record<string, unknown>;
    fileSrc?: string;
    height?: number;
    imageCacheTag?: string;
    size?: 'expand' | 'large' | 'medium' | 'none' | 'small';
    uploadConfig?: SanitizedCollectionConfig['upload'];
    width?: number;
};
export declare const Thumbnail: React.FC<ThumbnailProps>;
type ThumbnailComponentProps = {
    readonly alt?: string;
    readonly className?: string;
    readonly filename: string;
    readonly fileSrc: string;
    readonly imageCacheTag?: string;
    readonly size?: 'expand' | 'large' | 'medium' | 'none' | 'small';
};
export declare function ThumbnailComponent(props: ThumbnailComponentProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map
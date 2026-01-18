import type { ClientCollectionConfig, TypeWithID } from 'payload';
import React from 'react';
import './index.scss';
export type ThumbnailCardProps = {
    alignLabel?: 'center' | 'left';
    className?: string;
    collection?: ClientCollectionConfig;
    doc?: {
        filename?: string;
    } & TypeWithID;
    label?: string;
    onClick?: () => void;
    onKeyDown?: () => void;
    thumbnail: React.ReactNode;
};
export declare const ThumbnailCard: React.FC<ThumbnailCardProps>;
//# sourceMappingURL=index.d.ts.map